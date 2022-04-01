import {expect, test} from '@oclif/test'

describe('detect-scenes', () => {
  test
  .stdout()
  .command(['detect-scenes'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['detect-scenes', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
