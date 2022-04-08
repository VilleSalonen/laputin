import {expect, test} from '@oclif/test'

describe('merge-tags', () => {
  test
  .stdout()
  .command(['merge-tags'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['merge-tags', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
