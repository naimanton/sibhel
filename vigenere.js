const vigenere = {
	cipher(mode, item, key, alphabet) {
		let result = "";
		for (let i = 0; i < item.length; i++) {
			result += this.cipherOne.call(
				this,
				mode,
				item[i],
				key[i % key.length],
				alphabet
			);
		}
		return result;
	},
	cipherOne(mode, itemSym, keySym, alphabet) {
		let keyIndex = alphabet.indexOf(keySym);
		let itemIndex = alphabet.indexOf(itemSym);
		if (keyIndex === -1 || itemIndex === -1) {
			throw new Error('EncryptingError: symbol is not supported.')
		}
		if (!mode) keyIndex = -keyIndex;
		return alphabet[(itemIndex + keyIndex + alphabet.length) % alphabet.length ];
	},
	mixAlphabet(alphabet) {
		let result = "";
		alphabet = alphabet.split('');
		for (let i = alphabet.length; i; --i) {
			let index = Math.round(Math.random() * (alphabet.length-1));
			result += alphabet[index];
			alphabet.splice(index, 1);
		}
		return result;
	},
	generateKey(length, alphabet) {
		let result = "";
		const alphabetIndices = alphabet.length - 1;
		for (let i = length; i; --i) {
			let index = Math.round(Math.random() * alphabetIndices);
			result += alphabet[index];
		}
		return result;
	},
};
module.exports = vigenere;