# 📚 readlen

calculate reading stats for your text files with scientific precision.

## why?

ever wondered how long it'll take to read that markdown file? or how many words are in your documentation? `readlen` gotchu covered with reading time estimates based on actual research¹.

## usage

```bash
# basic usage
bun x readlen README.md

# multiple files
bun x readlen docs/*.md

# recursive mode (process all text files in subdirectories)
bun x readlen docs/ -r

# install globally (if you want to)
bun install -g readlen
```

## output

```
file: README.md
  words: 142
  characters: 824
  paragraphs: 6
  read time: ~1 minute(s)
```

## features

- 🎯 accurate reading time estimates based on research
- 📁 process single files or entire directories
- 🔍 supports .txt, .md, .html, and .json files
- 📊 detailed stats (words, characters, paragraphs)

¹ [Brysbaert, M. (2019). How many words do we read per minute? A review and meta-analysis of reading rate. Journal of Memory and Language, 109, Article 104047.](https://psycnet.apa.org/record/2019-59523-001).

---

built with ❤️ using [bun](https://bun.sh)
