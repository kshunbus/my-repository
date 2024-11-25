"use strict";
// const textarea = document.getElementById('textarea') as HTMLTextAreaElement
const textarea = document.getElementById('textarea');
// Mac 対応
if (navigator.userAgent.toLowerCase().indexOf('mac os') !== -1) {
    // Mac: ショートカットキーの表示を変更する
    // const undoKeyHint = document.getElementById('undoKey');
    const undoKeyHint = document.querySelector('#undoKey');
    undoKeyHint.textContent = '[command]+[z]';
    const redoKeyHint = document.getElementById('redoKey');
    redoKeyHint.textContent = '[command]+[shift]+[z]';
    // Mac: Undo/Redo 無効化
    document.body.addEventListener('keydown', (event) => {
        if (event.metaKey) {
            switch (event.key) {
                case 'z':
                    event.preventDefault();
                    return;
            }
        }
    });
    // Mac: ショートカットキー
    textarea.addEventListener('keydown', (event) => {
        if (!event.metaKey) {
            return;
        }
        switch (event.key) {
            case 'z':
                if (!event.shiftKey) {
                    undoAction();
                    return;
                }
                else {
                    redoAction();
                    return;
                }
        }
    });
}
// Mac 以外
else {
    // Undo/Redo 無効化
    document.body.addEventListener('keydown', (event) => {
        if (event.ctrlKey) {
            switch (event.key) {
                case 'z':
                case 'y':
                    event.preventDefault();
                    return;
            }
        }
    });
    // ショートカットキー
    textarea.addEventListener('keydown', (event) => {
        if (!event.ctrlKey) {
            return;
        }
        switch (event.key) {
            case 'z':
                if (!event.shiftKey) {
                    undoAction();
                    return;
                }
                else {
                    redoAction();
                    return;
                }
            case 'y':
                redoAction();
                return;
        }
    });
}
let lastValue = '';
textarea.addEventListener('input', (event) => {
    switch (event.inputType) {
        case 'historyUndo':
        case 'historyRedo':
            textarea.value = lastValue;
            return;
        default:
            lastValue = textarea.value;
            return;
    }
});
// textarea.addEventListener('input', (event: InputEvent) => {
// 	const { target } = event;
// 	if (target instanceof InputEvent) {
// 		switch (target.inputType) {
// 			case 'historyUndo':
// 			case 'historyRedo':
// 				textarea.value = lastValue
// 				return
// 			default:
// 				lastValue = textarea.value
// 				return
// 			}
// 	} else {
// 		return
// 	}
// })
// textarea.addEventListener('input', (event: InputEvent) => {
// 	switch (event.inputType) {
// 	case 'historyUndo':
// 	case 'historyRedo':
// 		textarea.value = lastValue
// 		return
// 	default:
// 		lastValue = textarea.value
// 		return
// 	}
// })
// 入力内容
class InputData {
    constructor(value, // 入力された値
    start, // 入力された値の開始地点
    end, // 入力された値の終了地点
    before, // 入力される前の値
    fromSelection, // 入力時の SelectionMode
    doMore, // 次の Undo を続けて実行するか
    undo // Redo の基となった Undo
    ) {
        this.value = value;
        this.start = start;
        this.end = end;
        this.before = before;
        this.fromSelection = fromSelection;
        this.doMore = doMore;
        this.undo = undo;
    }
}
// Undo/Redo
const undoStack = [];
const redoStack = [];
// Undo
const undoAction = (redoDoMore = false) => {
    if (undoStack.length === 0) {
        return;
    }
    const data = undoStack.pop();
    textarea.setRangeText(data.before, data.start, data.end, data.fromSelection);
    redoStack.push(new InputData(data.before, data.start, data.start + data.before.length, data.value, data.fromSelection, redoDoMore, data));
    updateLog();
    if (data.doMore) {
        undoAction(true);
    }
};
// Redo
const redoAction = () => {
    if (redoStack.length === 0) {
        return;
    }
    const data = redoStack.pop();
    textarea.setRangeText(data.before, data.start, data.end, data.fromSelection);
    undoStack.push(data.undo);
    updateLog();
    if (data.doMore) {
        redoAction();
    }
};
// 直前の選択内容
let selectionText;
// 現在のテキストの選択が変更された際に発生
document.addEventListener('selectionchange', () => {
    selectionText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
});
// IME
let imeBefore;
let imeTextStart;
let imeTextEnd;
textarea.addEventListener('compositionstart', () => {
    imeBefore = selectionText;
});
textarea.addEventListener('compositionupdate', () => {
    imeTextStart = textarea.selectionStart;
    imeTextEnd = textarea.selectionEnd;
});
textarea.addEventListener('compositionend', () => {
    // 入力を全て削除した場合
    if (imeTextStart === textarea.selectionEnd) {
        return;
    }
    undoStack.push(new InputData(textarea.value.slice(imeTextStart, imeTextEnd), imeTextStart, imeTextEnd, imeBefore, 'end', false));
    redoStack.length = 0;
    updateLog();
});
// 追加
textarea.addEventListener('input', (event) => {
    switch (event.inputType) {
        // IME 変換中＆確定時
        case 'insertCompositionText':
            // InputEvent では扱わない
            return;
        // 改行 (event.data === null)
        case 'insertLineBreak':
            undoStack.push(new InputData('\n', textarea.selectionEnd - 1, textarea.selectionEnd, selectionText, 'end', false));
            redoStack.length = 0;
            updateLog();
            return;
    }
    // ドロップ
    if (event.inputType === 'insertFromDrop') {
        undoStack.push(new InputData(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd), textarea.selectionStart, textarea.selectionEnd, '', 'select', // redo 時のドラッグ用
        true));
        redoStack.length = 0;
        updateLog();
        return;
    }
    // キーボード入力
    if (event.data !== null) {
        undoStack.push(new InputData(event.data, textarea.selectionEnd - event.data.length, textarea.selectionEnd, selectionText, 'end', false));
        redoStack.length = 0;
        updateLog();
        return;
    }
});
// 貼り付け
textarea.addEventListener('paste', (event) => {
    const value = event.clipboardData.getData('text');
    undoStack.push(new InputData(value, textarea.selectionEnd, textarea.selectionEnd + value.length, selectionText, 'end', false));
    redoStack.length = 0;
    updateLog();
});
// 削除
// BackSpace/Delete
textarea.addEventListener('beforeinput', (event) => {
    if (textarea.selectionStart === textarea.selectionEnd) {
        switch (event.inputType) {
            case 'deleteContentBackward':
                selectionText = textarea.value.slice(textarea.selectionStart - 1, textarea.selectionEnd);
                return;
            case 'deleteContentForward':
                selectionText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd + 1);
                return;
        }
    }
});
textarea.addEventListener('input', (event) => {
    switch (event.inputType) {
        case 'deleteContentBackward':
            undoStack.push(new InputData('', textarea.selectionEnd, textarea.selectionEnd, selectionText, 'end', false));
            redoStack.length = 0;
            updateLog();
            return;
        case 'deleteContentForward':
            undoStack.push(new InputData('', textarea.selectionEnd, textarea.selectionEnd, selectionText, 'start', false));
            redoStack.length = 0;
            updateLog();
            return;
        case 'deleteByDrag':
            undoStack.push(new InputData('', textarea.selectionEnd, textarea.selectionEnd, selectionText, 'select', false));
            redoStack.length = 0;
            updateLog();
            return;
    }
});
// 切り取り
textarea.addEventListener('cut', () => {
    undoStack.push(new InputData('', textarea.selectionStart, textarea.selectionStart, // selectionEnd: 切り取り前の位置なので駄目
    selectionText, 'select', false));
    redoStack.length = 0;
    updateLog();
});
// ログ
const undoLog = document.getElementById('undo');
const redoLog = document.getElementById('redo');
const updateLog = () => {
    undoLog.textContent = '';
    redoLog.textContent = '';
    const undoTemp = document.createDocumentFragment();
    for (const data of undoStack) {
        const line = document.createElement('div');
        line.style.borderBottom = '1px solid #000';
        line.textContent = `(${data.start}-${data.end}) value: ${data.value}, before: ${data.before}`;
        undoTemp.appendChild(line);
    }
    const redoTemp = document.createDocumentFragment();
    for (const data of redoStack) {
        const line = document.createElement('div');
        line.style.borderBottom = '1px solid #000';
        line.textContent = `(${data.start}-${data.end}) value: ${data.value}, before: ${data.before}`;
        redoTemp.appendChild(line);
    }
    undoLog.appendChild(undoTemp);
    redoLog.appendChild(redoTemp);
};
