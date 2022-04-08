import {expect, test} from '@oclif/test'

describe('set-screenshot', () => {
  test
  .stdout()
  .command(['set-screenshot'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['set-screenshot', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
