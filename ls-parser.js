function handleWarnings(warnings) {
		if (warnings.length > 0) {
				warnings.map(x => console.warn(x));
				alert("Grammar parser warnings:\n - " + warnings.reduce(function(a, b){
						if (a.indexOf(b) < 0 ) a.push(b);
						return a;
				},[]).join("\n - "));
		}
}

function parseGrammar() {
		console.info("Parsing grammar");
		var gform = document.getElementById("sgrammar");
		var rawlines = gform.value.trim().split('\n').map(x => x.trim()).filter(x => x.length > 0);
		var grammar = {};
		var lineRe = /^(.)\s*:\s*(.+)\s*$/;
		var exprRe = /^([^{]+)(?:\{(.+)\})?$/;
		var warnings = [];
		for (i = 0; i < rawlines.length; i++) {
				var l = rawlines[i];
				// console.info(l);
				// console.log(lineRe.exec(l));
				if (!lineRe.test(l)) {
						warnings.push(`Syntax error on line ${i+1}: "${l}"`);
						continue
				}
				var lm = lineRe.exec(l);
				if (lm.length < 3) {warnings.push(`Could not parse grammar line ${i+1}: "${l}" (js fault?)`); continue}
				var letter = lm[1];
				if (grammar.hasOwnProperty(letter)) warnings.push(`Multiple definitions for "${letter}": always using the last one!`);
				var expression = lm[2].split(';');
				var exprparts = [];
				for (j = 0; j < expression.length; j++) {
						var atom = expression[j].trim();
						if (!exprRe.test(atom)) {
								warnings.push(`Line ${i+1}, expression part ${j+1}: "${atom}": parsing failed!`);
								continue
						}
						var am = exprRe.exec(atom);
						if (am.length < 3) {warnings.push(`Line ${i+1}, expression part ${j+1} ("${atom}"): error (js fault?)`); continue};
						exprparts.push([am[1], am[2]]);
				}

				grammar[letter] = exprparts;
		}
		handleWarnings(warnings);
		return grammar;
}

function parseAxiom(alphabet) {
		var axnode = document.getElementById("saxiom");
		var text = axnode.value.trim();
		if (text.length == 0) {
				console.error("Empty axiom!");
				alert("Empty axiom!");
				throw "Empty axiom!";
		}
		var uniqtext = Array.from(text).filter((v, i, s) => s.indexOf(v)===i);
		var bad = uniqtext.filter(x => !alphabet.includes(x)).join(", ");
		var good = uniqtext.filter(x => alphabet.includes(x)).join("");
		if (bad.length > 0) {
				var msg = `Axiom contains letters that are not in the alphabet:\nBad letters: ${bad}\nGood letters: ${good}`;
				console.warn(msg);
				alert(msg);
		}
		return text;
}

function isWordOfAlphabet(alphabet, word) {
		var bad = Array.from(word).filter(x => !alphabet.includes(x));
		return bad.length == 0;
}

function filterGoodLetters(alphabet, word) {
		return Array.from(word).filter(x => alphabet.includes(x)).join("");
}

function parseReplacementRules(alphabet) {
		var repnode = document.getElementById("srules");
		var warnings = [];
		var rules = {};
		alphabet.map(x => rules[x] = x);
		var rulelines = repnode.value.trim().split('\n').map(x => x.trim()).filter(x => x.length > 0);
		var ruleRe = /^(.)\s*:\s*(.+)\s*$/;
		for (i = 0; i < rulelines.length; i++) {
				l = rulelines[i];
				if (!ruleRe.test(l)) {warnings.push(`Syntax error on line ${i+1}: "${l}". Ignoring rule.`); continue};
				var lm = ruleRe.exec(l);
				if (lm.length < 3) {warnings.push(`Error on line ${i+1}: "${l}" (js fault?). Ignoring rule.`); continue};
				var letter = lm[1];
				var replacement = lm[2];
				if (!isWordOfAlphabet(alphabet, replacement)) {
						warnings.push(`Line ${i+1}: illegal letters in "${replacement}". Ignoring bad characters.`);
						rules[letter] = filterGoodLetters(alphabet, replacement);
				} else {
						rules[letter] = replacement;
				}
		}
		handleWarnings(warnings);
		return rules;
}

function doReplacement(word, rules, iterations = 1) {
		if (iterations < 1) return word;
		if (iterations == 1) return Array.from(word).map(x => rules[x]).join("");
		return doReplacement(doReplacement(word, rules), rules, iterations - 1);
}

function makeWordlengthTable(axiom, rules, iterations) {
		var word = axiom;
		var tablenode = document.getElementById("wordlengths-table");
		tablenode.removeChild(tablenode.firstChild);
		var tbnode = document.createElement('tbody');
		var thr = tbnode.insertRow();
		thr.insertCell().appendChild(document.createTextNode("Iteration"));
		thr.insertCell().appendChild(document.createTextNode("Word length"));

		for (i=0; i <= iterations; i++) {
				word = doReplacement(word, rules, i==0 ? 0 : 1);
				var tr = tbnode.insertRow();
				var td = tr.insertCell().appendChild(document.createTextNode(`${i}`));
				var td = tr.insertCell().appendChild(document.createTextNode(`${word.length}`));
		}
		tablenode.appendChild(tbnode);
}
