function sort(tabs) {
    tabs.sort((a, b) => a.url >= b.url ? 1 : -1);
    return tabs;
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