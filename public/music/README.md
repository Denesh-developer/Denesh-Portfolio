# /public/music — the four records on the wall

Put your songs + covers here, then update `src/music/onrepeat/onRepeatTracks.ts`:

```
public/music/track-1.mp3   ← audio (mp3 / m4a / ogg)
public/music/cover-1.jpg   ← square artwork, ~600×600 (jpg / png / webp)
… track-2 / cover-2, track-3 / cover-3, track-4 / cover-4
```

Then in `onRepeatTracks.ts` set each record's `title`, `artists`, `src` and `artwork`
(e.g. `artwork: '/music/cover-1.jpg'`). Optionally add `highlights` — your favourite
stretch(es), e.g. `{ from: '1:02', to: '1:24', note: 'the chorus' }` — they show as ♥ marks
on the seek bar. The `cover-*.svg` files are placeholders — delete
them once your real covers are in.
