const Page = require('./helper/page')

let page;

beforeEach(async () => {
  page = await Page.build()
  await page.goto('http://localhost:3000')
})

afterEach(async () => {
  await page.close()
})

describe('when logged in', async () => {

  beforeEach(async () => {
    await page.login();
    await page.click('a.btn-floating');

  })

  test('Can see blog create form', async () => {
    const label = await page.getContentsOf('form label');
    expect(label).toEqual('Blog Title')

  })

  describe('and using valid inputs', async () => {
    let blogTitle = 'My title';
    let blogContent = 'My title';
    beforeEach(async () => {
      await page.type('.title input', blogTitle)
      await page.type('.content input', blogContent)
      await page.click('form button');
    })

    test('submitting takes user to review screen', async () => {
      const text = await page.getContentsOf('h5');
      expect(text).toEqual('Please confirm your entries')
    })

    test('submitting saving blog to index page', async () => {
      await page.click('button.green')
      await page.waitFor('.card');

      const newBlogTitle = await page.getContentsOf('.card-title');
      const newBlogContent = await page.getContentsOf('p');
      expect(newBlogTitle).toEqual(blogTitle)
      expect(newBlogContent).toEqual(blogContent)

    })
  });

  describe('and using invalid inputs', async () => {

    beforeEach(async () => {
      await page.click('form button');
    })

    test('the form shows error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text')
      const contentError = await page.getContentsOf('.content .red-text')
      expect(titleError).toEqual('You must provide a value')
      expect(contentError).toEqual('You must provide a value')
    })
  });


});

describe('when logged out', async () => {
  const actions = [
    {
      method: 'get',
      path: '/api/blogs'
    },
    {
      method: 'post',
      path: '/api/blogs',
      data: {
        title: 'My title',
        content: 'My content',
      }
    },
  ]
  test('Blog related actions are prohibited', async () => {
    const results = await page.execRequests(actions)

    for (let result of results) {
      expect(result).toEqual({error: 'You must log in!'})
    }
  })

});