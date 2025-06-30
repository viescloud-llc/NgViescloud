import { LazyPageChange } from "../util-component/mat-table-lazy/mat-table-lazy.component";

export class RestUtils {

    static formatSort(lazyPageChange: LazyPageChange): string {
        let sortKey = lazyPageChange.sort.key;
        let sortOrder = lazyPageChange.sort.order;
        let sort = '';
        if(sortKey && sortOrder)
            sort = sortKey + ':' + sortOrder;

        return sort;
    }
}