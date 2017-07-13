import { LaputinPage } from './app.po';

describe('laputin App', () => {
  let page: LaputinPage;

  beforeEach(() => {
    page = new LaputinPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
