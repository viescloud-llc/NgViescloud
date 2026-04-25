export interface Crud<T> {
    create(data: T): T;
    read(id: string): T;
    update(id: string, data: T): T;
    delete(id: string): T;
}

export interface CrudAsync<T> {
    create(data: T): Promise<T>;
    read(id: string): Promise<T>;
    update(id: string, data: T): Promise<T>;
    delete(id: string): Promise<T>;
}