import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CsvExportService } from './csv-export.service';

describe('CsvExportService', () => {
  let service: CsvExportService;
  let capturedBlob: Blob | undefined;
  let clickCount: number;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvExportService);

    capturedBlob = undefined;
    clickCount = 0;

    // Capture the Blob passed to createObjectURL and stub URL lifecycle methods.
    vi.spyOn(URL, 'createObjectURL').mockImplementation((obj: Blob | MediaSource) => {
      capturedBlob = obj as Blob;
      return 'blob:mock-url';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    // Prevent an actual navigation/download by stubbing the anchor click.
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      clickCount++;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Reads the Blob content and strips a leading BOM if present.
   * jsdom's Blob.text() may transparently consume the BOM, so CSV body
   * assertions are made against the BOM-less text. The BOM itself is verified
   * separately at the byte level.
   */
  async function blobBody(blob: Blob): Promise<string> {
    const text = await blob.text();
    return text.startsWith('\uFEFF') ? text.slice(1) : text;
  }

  it('should prepend a UTF-8 BOM to the generated file (byte-level)', async () => {
    service.export(['A'], [['1']], 'bom');

    const bytes = new Uint8Array(await capturedBlob!.arrayBuffer());
    // UTF-8 encoding of U+FEFF is EF BB BF.
    expect(bytes[0]).toBe(0xef);
    expect(bytes[1]).toBe(0xbb);
    expect(bytes[2]).toBe(0xbf);
  });

  it('should build a CSV with header row and data rows, trigger download and revoke the URL', async () => {
    service.export(['Name', 'Age'], [['Alice', '30'], ['Bob', '25']], 'users');

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickCount).toBe(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(capturedBlob).toBeInstanceOf(Blob);
    expect(capturedBlob!.type).toContain('text/csv');

    expect(await blobBody(capturedBlob!)).toBe('Name,Age\nAlice,30\nBob,25');
  });

  it('should quote fields containing commas', async () => {
    service.export(['City'], [['Paris, France']], 'cities');

    expect(await blobBody(capturedBlob!)).toBe('City\n"Paris, France"');
  });

  it('should escape embedded double quotes by doubling them', async () => {
    service.export(['Quote'], [['She said "hi"']], 'quotes');

    expect(await blobBody(capturedBlob!)).toBe('Quote\n"She said ""hi"""');
  });

  it('should quote fields containing newlines', async () => {
    service.export(['Note'], [['line1\nline2']], 'notes');

    expect(await blobBody(capturedBlob!)).toBe('Note\n"line1\nline2"');
  });

  it('should produce only the header row when there are no data rows', async () => {
    service.export(['A', 'B'], [], 'empty');

    expect(await blobBody(capturedBlob!)).toBe('A,B');
  });

  it('should set the download filename with a .csv extension', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');

    service.export(['A'], [['1']], 'my-report');

    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('my-report.csv');
    expect(anchor.href).toContain('blob:mock-url');
  });
});
