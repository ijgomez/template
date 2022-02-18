export class TemplateCriteria {

    id: number | any;

	/** Selected page number (Pagination attribute). */
    pageNumber: number | undefined;

    /** Number of records per page (Pagination attribute). */
    pageSize: number | undefined;

    /** Field by which the information is ordered (Pagination attribute). */
    sortField: String | undefined;

    /** Sense of ordering information (Pagination attribute). */
    sortOrder: String | undefined;

}
