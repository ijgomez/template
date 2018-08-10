import { PaginasModule } from './paginas.module';

describe('PaginasModule', () => {
  let paginasModule: PaginasModule;

  beforeEach(() => {
    paginasModule = new PaginasModule();
  });

  it('should create an instance', () => {
    expect(paginasModule).toBeTruthy();
  });
});
