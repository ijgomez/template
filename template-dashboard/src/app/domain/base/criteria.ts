/**
 * Class that defines the attributes common to all Criteria classes.
 */
export class Criteria {

    /** Selected page number (Pagination attribute). */
    pageNumber: number;

    /** Number of records per page (Pagination attribute). */
    pageSize: number;

    /** Field by which the information is ordered (Pagination attribute). */
    sortField: String;

    /** Sense of ordering information (Pagination attribute). */
    sortOrder: String;

}
