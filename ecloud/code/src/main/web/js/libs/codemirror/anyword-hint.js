// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  var WORD = /[\w$]+/, RANGE = 500;

  CodeMirror.registerHelper("hint", "anyword", function(editor, options) {
    var word = options && options.word || WORD;
    var range = options && options.range || RANGE;
    var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
    var end = cur.ch, start = end;
    while (start && word.test(curLine.charAt(start - 1))) --start;
    var curWord = start != end && curLine.slice(start, end);
    var commonKeywords = ["as", "assert", "break", "class", "continue",
      "def", "del", "elif", "else", "except", "finally",
      "for", "from", "global", "if", "import",
      "lambda", "pass", "raise", "return",
      "try", "while", "with", "yield", "in"];
    var commonBuiltins = ["abs", "all", "any", "bin", "bool", "bytearray", "callable", "chr",
      "classmethod", "compile", "complex", "delattr", "dict", "dir", "divmod",
      "enumerate", "eval", "filter", "float", "format", "frozenset",
      "getattr", "globals", "hasattr", "hash", "help", "hex", "id",
      "input", "int", "isinstance", "issubclass", "iter", "len",
      "list", "locals", "map", "max", "memoryview", "min", "next",
      "object", "oct", "open", "ord", "pow", "property", "range",
      "repr", "reversed", "round", "set", "setattr", "slice",
      "sorted", "staticmethod", "str", "sum", "super", "tuple",
      "type", "vars", "zip", "__import__", "NotImplemented",
      "Ellipsis", "__debug__"];
    var list = options && options.list || commonKeywords.concat(commonBuiltins), seen = {};
    var re = new RegExp(word.source, "g");
    for (var dir = -1; dir <= 1; dir += 2) {
      var line = cur.line, endLine = Math.min(Math.max(line + dir * range, editor.firstLine()), editor.lastLine()) + dir;
      for (; line != endLine; line += dir) {
        var text = editor.getLine(line), m;
        while (m = re.exec(text)) {
          if (line == cur.line && m[0] === curWord) continue;
          if ((!curWord || m[0].lastIndexOf(curWord, 0) == 0) && !Object.prototype.hasOwnProperty.call(seen, m[0])) {
            seen[m[0]] = true;
            list.push(m[0]);
          }
        }
      }
    }
    return {list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
  });
});
