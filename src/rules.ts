// トークンとしての優先順位はキー名の定義順で決まる
// 値が配列の場合は (?: と ) で囲われたパターンとして展開される
// 値がオブジェクトの場合はオブジェクトのキー名はグローバルなパターンを持たないトークンとしてトップに展開される。この時パターンを持つトップのキーとの重複は不可。
// トップで null として定義されているキー名は文脈依存トークンとしてグローバルなパターンを持たないトークンとして定義されキー名の重複やそのパターンが各文脈で異なることは許される。
// RegExp内に {[a-zA-Z][a-zA-Z0-9_]*} のようなパターンがある場合は、その名前のトークンの正規表現に展開される。
// 展開した中に更に同様のパターンがある場合はそのようなパターンが無くなるまで再帰的に展開される。
// トークンは複数のサブトークンのユニオンやサブトークンのパターンを複数含んだパターンとしても定義できる。
// 内包した複数のトークンはそのトークンの処理時にはそれぞれのトークンとして認識認識できる。
// タグ付き正規表現で定義されるトークンもありうる。例えば sourceInfo 内のfilename, lineNumber, lineColumn のようなトークンに対して個別に色付けができるようにする。
// サブトークンは lineNumber: /\d+/ のようなグローバルなパターンを持つトークンとして認識されることはない。これは恐らく number があるならば number として認識されるべき。
// サブトークンはグローバルにマッチングすることは無いが、テーマなどで利用できるキーとして明記するために null のように定義できる。
// サブトークンは複数のトークン内で文脈依存のパターンでマッチするトークンとして認識されることになる（複数箇所での文脈依存なパターンがユニオンされたパターンとしてグローバルに反映されるようなことは起きない）
// これはユーザが ~/.config/colorize/config.ts 等で export { tokens: {} } として定義したものを実行時にマージ可能ともする。

const tokens = {
    timestamp: /\b{date}[T ]{time}{timezone}\b/,
    // date,time,timezoneのこれらは timestamp 内で展開されることが目的で
    // これ単体では優先的にグローバルなトークンにはなってほしくないが
    // グローバルにも使いたいかもしれないので lexer に渡す際のトークン優先順位としては後半にしたい
    // しかし、複雑なパターンであるtimestampとの関連から近くに定義したい気持ちもある
    // TODO: このような定義をどう行うのがベストか考える
    date: [
        /\b\d{4}-\d{2}-\d{2}\b/,
        /\b\d{4}\/\d{2}\/\d{2}\b/,
    ],
    time: /\b\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?\b/,
    timezone: /\b(?:Z|[+-]\d{2}:?\d{2})\b/,

    quotedString: [
        /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|[0-7]{1,3}|.))*"/,
        /'(?:[^\\']|\\(?:[bfnrtv'\\/]|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|[0-7]{1,3}|.))*'/
    ],

    filename: null, // サブトークンとして定義される予定のキーを明示する場合は null とする。これはなくても自動で定義もされるが明示しておくとわかりやすい。
    lineNumber: null,
    lineColumn: null,
    // sourceInfoは後で名前付きキャプチャグループではなく、位置ベースのパターンとして実装する
    sourceInfo: [
        /\[[^\]:]+:\d+(?::\d+)?\]/,  // [src/file.ts:123] or [src/file.ts:123:45]
        /\([^):]+:\d+(?::\d+)?\)/,   // (app.js:456) or (app.js:456:10)
        /[^\s:]+:\d+(?::\d+)?:/       // src/index.ts:789: or src/index.ts:789:12:
    ],

    // ipAddress: /{ipAddressV4}|{ipAddressV6}/, のような埋め込み方式の他に階層的に書くことも出来る。
    ipAddress: {
        ipAddressV4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/,
        ipAddressV6: {
            IPAddressV6InBrackets: /\[(?:[0-9a-fA-F]{0,4}:){1,7}:?(?:[0-9a-fA-F]{0,4}:){0,6}[0-9a-fA-F]{0,4}\]|\[::\]/,
            // IPv6完全形式
            IPAddressV6Full: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/,
            // IPv6圧縮形式: :: を含む短縮記法
            IPAddressV6Compressed: /\b(?:[0-9a-fA-F]{0,4}:){1,7}:(?:[0-9a-fA-F]{0,4}:){0,6}[0-9a-fA-F]{0,4}\b/,
            // IPv6ループバック: ::1
            IPAddressV6Loopback: /::1\b/,
            // IPv6リンクローカル: fe80:: で始まり、%インターフェース名を含む
            IPAddressV6LinkLocal: /\bfe80:(?::[0-9a-fA-F]{0,4}){0,7}(?:%[a-zA-Z0-9._-]+)?\b/,
            // IPv4マップドIPv6: ::ffff:IPv4
            IPAddressV6MappedV4: /::ffff:{ipAddressV4}\b/,
        }
    },

    ws: /\b\s*\b/,
    newline: /\r?\n/,

    boolean: /\b(?:true|false)\b/,
    number: /\b\d+\b/,
    null: /\bnull\b/,
    undefined: /\bundefined\b/,
    keyword: /\b(?:if|else|while|for|break|continue|return|function|class|let|const|var|this|super|extends|implements|interface|enum|import|export|default|module|namespace|import|export|from|as|of|yield|await)\b/,
    identifier: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/,
};

// ユーザは ~/.config/colorize/config.ts 等で新しいトークンやテーマを定義することも出来る
// {
//   tokens: {
//     specialKeyword: /\bAIUEO\b/,
//   },
//   parentTheme: "none", // ベースのテーマを指定可能にすることでデフォルトを全部無効化するなど？
//   theme: {
//     specialKeyword: "red", // 独自トークンに対する色付け
//     string: undefined, // デフォルトの一部テーマを無効化なども?
//   },
// }
//
// TODO: configは先読みマッチングでのログ形式推論からのtheme決定や適用などのより上位の設定にして、theme-user1.ts とかで定義する？この辺のアイデアは後で考える


// config としてexportされる
export const config = {
    tokens,

    // この辺はコンフィグとかで使う？
    theme: {
        // TokenContext は今後どういうのが使いやすいか考える
        string: (tokenContext: Record<string, unknown>) => tokenContext?.value as string,
        timestamp: {
            color: "red",
            fontWeight: "bold",
        },
        // sourceInfo 内の filename のみに適用する時はこのように書ける。sourceInfo 以外での filename というサブトークンには適用されない。
        sourceInfo_filename: "blue",
        // 列挙時の記述性を優先した値の書き方も可能（前処理で良い感じに展開される, CSSの rgb(), oklch() や元(左)の色に対して明るくとか暗くのようなことも出来ると面白いかも）
        // TODO: フロントと背景色の定義仕分けはどうするか？良い書き方を検討する(カンマ区切りなど？"color定義,bgColor定義"のような形式とか)
        lineNumber: "yellow|bold",
        lineColumn: "#f92672|bold",
    }
};
