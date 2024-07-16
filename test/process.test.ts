import { blogify } from '../src/process.js';

test("blogify transforms content of file object", () => {
  const inputFile = {
    content:
      '---\ntitle: "The importance of good testing"\ndate: 2024-04-17\npublish: true\n---\nTags: [[career]], [[learnings]]\n\nIn my very early days of programming, I remember that all the code that I wrote had zero testing. I always left it as an afterthought. I thought of it as something to do if I wanted to be fancy or excessive.\n\nAfter some of my experiences, I\'ve learned that good testing can be an investment that takes 20% of effort but results in 80% of positive results',
    data: {
      title: "The importance of good testing",
      date: "2024-04-17T00:00:00.000Z",
      publish: true,
    },
    isEmpty: false,
    excerpt: "",
    root: "/",
    dir: "/Users/dannyvelasquez/RemoteGit/MyGithub/notes",
    base: "the-importance-of-good-testing.md",
    ext: ".md",
    name: "the-importance-of-good-testing",
  };
  const outputFile = blogify(inputFile, []);
});
