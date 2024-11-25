
let tx;

window.addEventListener("DOMContentLoaded", () => {
	tx = document.querySelector('.text-input');
	const btns = document.querySelectorAll('.mark-btn');
	const submitBtn = document.querySelector('#submit');

	btns.forEach(btn => {
		btn.addEventListener('click', e => inputMarkBtn(e));
	});

	submitBtn.addEventListener('click', e => submitInput(e));

	// tx.querySelector('span').addEventListener('click', e => e.preventDefault());
});



function submitInput(e) {
	e.preventDefault();

	const clone = tx.cloneNode(true);

	clone.querySelectorAll('span.mark__name').forEach(el => el.innerHTML = "[*氏名*]");
	clone.querySelectorAll('span.mark__age').forEach(el => el.innerHTML = "[*年齢*]");
	clone.querySelectorAll('span.mark__sex').forEach(el => el.innerHTML = "[*性別*]");

	let msg = '';
	clone.childNodes.forEach((el) => {
		const content = el.textContent;
		msg += el.tagName === 'DIV' ? `\n${content}` : content;
	});
}



function inputMarkBtn(e) {
	e.preventDefault();
	
	tx.focus();
	const selectRange = document.getSelection().getRangeAt(0);

	const markName = e.currentTarget.getAttribute('name');
	const markView = e.currentTarget.dataset.mark;

	const span = document.createElement('span');

	span.setAttribute('class', `mark mark__${markName}`);
	span.setAttribute('contenteditable', 'false');

	const textNode = document.createTextNode(markView);
	span.appendChild(textNode);
	selectRange.insertNode(span);

	// 追加したノードの直後を選択状態にする
	selectRange.setStartAfter(span);
}
