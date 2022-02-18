import { Entity } from '../base/entity.model';
import { ReportEngine } from './report-engine.model';

export interface Report extends Entity {

    name: string;

    engine: ReportEngine;

    description: string;

    descriptor: {
        filename: string;
        data: any;
        filetype: string;
        size: number;
    }

    url: string;
}
