function sort(tabs) {
    tabs.sort((a, b) => a.url >= b.url ? 1 : -1);
    return tabs;
}

function group(tabs) {
    sort(tabs);

    function extractKey(url) {
        if (!url || !url.startsWith('http')) return "その他";
        return url.split('/')[2];
    }

    return tabs.reduce((acc, tab) => {
        const key = extractKey(tab.url);
        if (!acc[key]) acc[key] = [];
        acc[key].push(tab);
        return acc;
    }, {});
}

test('URL順に並び替える', () => {
    expect(sort(
        [
            { url: 'http://hogedriven.net/b' },
            { url: "http://hogedriven.net/a" }
        ]))
        .toEqual([
            { url: 'http://hogedriven.net/a' },
            { url: 'http://hogedriven.net/b' }
        ]);
});

test('ドメインでグルーピングする', () => {
    const actual = group([
        { url: 'http://hogedriven.net/b' },
        { url: "http://hogedriven.net/c" },
        { url: 'chrome://extensions/' },
        { url: 'https://hogedriven.net/a' }
    ]);
    expect(actual).toEqual({
        'hogedriven.net': [
            { url: 'http://hogedriven.net/b' },
            { url: 'http://hogedriven.net/c' },
            { url: 'https://hogedriven.net/a' }
        ],
        'その他': [
            { url: 'chrome://extensions/' }
        ]
    });
});