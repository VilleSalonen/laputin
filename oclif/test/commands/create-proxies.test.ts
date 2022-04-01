import {expect, test} from '@oclif/test'

describe('create-proxies', () => {
  test
  .stdout()
  .command(['create-proxies'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['create-proxies', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
