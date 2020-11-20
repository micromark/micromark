// This module is compiled away!
//
// micromark works based on character codes.
// This module contains constants for the ASCII block and the replacement
// character.
// A couple of them are handled in a special way, such as the line endings
// (CR, LF, and CR+LF, commonly known as end-of-line: EOLs), the tab (horizontal
// tab) and its expansion based on what column it’s at (virtual space),
// and the end-of-file (eof) character.
// As values are preprocessed before handling them, the actual characters LF,
// CR, HT, and NUL (which is present as the replacement character), are
// guaranteed to not exist.
//
// Unicode basic latin block.
export var carriageReturn = -5
export var lineFeed = -4
export var carriageReturnLineFeed = -3
export var horizontalTab = -2
export var virtualSpace = -1
export var eof = null
export var nul = 0
export var soh = 1
export var stx = 2
export var etx = 3
export var eot = 4
export var enq = 5
export var ack = 6
export var bel = 7
export var bs = 8
export var ht = 9 // `\t`
export var lf = 10 // `\n`
export var vt = 11 // `\v`
export var ff = 12 // `\f`
export var cr = 13 // `\r`
export var so = 14
export var si = 15
export var dle = 16
export var dc1 = 17
export var dc2 = 18
export var dc3 = 19
export var dc4 = 20
export var nak = 21
export var syn = 22
export var etb = 23
export var can = 24
export var em = 25
export var sub = 26
export var esc = 27
export var fs = 28
export var gs = 29
export var rs = 30
export var us = 31
export var space = 32
export var exclamationMark = 33 // `!`
export var quotationMark = 34 // `"`
export var numberSign = 35 // `#`
export var dollarSign = 36 // `$`
export var percentSign = 37 // `%`
export var ampersand = 38 // `&`
export var apostrophe = 39 // `'`
export var leftParenthesis = 40 // `(`
export var rightParenthesis = 41 // `)`
export var asterisk = 42 // `*`
export var plusSign = 43 // `+`
export var comma = 44 // `,`
export var dash = 45 // `-`
export var dot = 46 // `.`
export var slash = 47 // `/`
export var digit0 = 48 // `0`
export var digit1 = 49 // `1`
export var digit2 = 50 // `2`
export var digit3 = 51 // `3`
export var digit4 = 52 // `4`
export var digit5 = 53 // `5`
export var digit6 = 54 // `6`
export var digit7 = 55 // `7`
export var digit8 = 56 // `8`
export var digit9 = 57 // `9`
export var colon = 58 // `:`
export var semicolon = 59 // `;`
export var lessThan = 60 // `<`
export var equalsTo = 61 // `=`
export var greaterThan = 62 // `>`
export var questionMark = 63 // `?`
export var atSign = 64 // `@`
export var uppercaseA = 65 // `A`
export var uppercaseB = 66 // `B`
export var uppercaseC = 67 // `C`
export var uppercaseD = 68 // `D`
export var uppercaseE = 69 // `E`
export var uppercaseF = 70 // `F`
export var uppercaseG = 71 // `G`
export var uppercaseH = 72 // `H`
export var uppercaseI = 73 // `I`
export var uppercaseJ = 74 // `J`
export var uppercaseK = 75 // `K`
export var uppercaseL = 76 // `L`
export var uppercaseM = 77 // `M`
export var uppercaseN = 78 // `N`
export var uppercaseO = 79 // `O`
export var uppercaseP = 80 // `P`
export var uppercaseQ = 81 // `Q`
export var uppercaseR = 82 // `R`
export var uppercaseS = 83 // `S`
export var uppercaseT = 84 // `T`
export var uppercaseU = 85 // `U`
export var uppercaseV = 86 // `V`
export var uppercaseW = 87 // `W`
export var uppercaseX = 88 // `X`
export var uppercaseY = 89 // `Y`
export var uppercaseZ = 90 // `Z`
export var leftSquareBracket = 91 // `[`
export var backslash = 92 // `\`
export var rightSquareBracket = 93 // `]`
export var caret = 94 // `^`
export var underscore = 95 // `_`
export var graveAccent = 96 // `` ` ``
export var lowercaseA = 97 // `a`
export var lowercaseB = 98 // `b`
export var lowercaseC = 99 // `c`
export var lowercaseD = 100 // `d`
export var lowercaseE = 101 // `e`
export var lowercaseF = 102 // `f`
export var lowercaseG = 103 // `g`
export var lowercaseH = 104 // `h`
export var lowercaseI = 105 // `i`
export var lowercaseJ = 106 // `j`
export var lowercaseK = 107 // `k`
export var lowercaseL = 108 // `l`
export var lowercaseM = 109 // `m`
export var lowercaseN = 110 // `n`
export var lowercaseO = 111 // `o`
export var lowercaseP = 112 // `p`
export var lowercaseQ = 113 // `q`
export var lowercaseR = 114 // `r`
export var lowercaseS = 115 // `s`
export var lowercaseT = 116 // `t`
export var lowercaseU = 117 // `u`
export var lowercaseV = 118 // `v`
export var lowercaseW = 119 // `w`
export var lowercaseX = 120 // `x`
export var lowercaseY = 121 // `y`
export var lowercaseZ = 122 // `z`
export var leftCurlyBrace = 123 // `{`
export var verticalBar = 124 // `|`
export var rightCurlyBrace = 125 // `}`
export var tilde = 126 // `~`
export var del = 127
// Unicode Specials block.
export var byteOrderMarker = 65279
// Unicode Specials block.
export var replacementCharacter = 65533 // `�`
