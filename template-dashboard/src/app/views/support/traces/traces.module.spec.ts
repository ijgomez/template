import { TracesModule } from './traces.module';

describe('TracesModule', () => {
  let tracesModule: TracesModule;

  beforeEach(() => {
    tracesModule = new TracesModule();
  });

  it('should create an instance', () => {
    expect(tracesModule).toBeTruthy();
  });
});
