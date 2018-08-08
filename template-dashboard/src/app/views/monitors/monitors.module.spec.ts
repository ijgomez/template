import { MonitorsModule } from './monitors.module';

describe('MonitorsModule', () => {
  let monitorsModule: MonitorsModule;

  beforeEach(() => {
    monitorsModule = new MonitorsModule();
  });

  it('should create an instance', () => {
    expect(monitorsModule).toBeTruthy();
  });
});
