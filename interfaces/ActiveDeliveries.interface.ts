export interface planDelivery {
    id:                  number;
    idealPortion:        string;
    status:              string;
    createdAt:           Date;
    updatedAt:           Date;
    deleted_At:          null;
    pets:                Pets;
    descriptionProducts: DescriptionProduct[];
}

export interface DescriptionProduct {
    id:         number;
    createdAt:  Date;
    updatedAt:  Date;
    deleted_at: null;
    products:   Products;
}

export interface Products {
    id:                     number;
    name:                   string;
    image:                  string;
    ingredientsDescription: string;
    nutritionalInformation: string;
    price:                  number;
    status:                 string;
    createdAt:              Date;
    updatedAt:              Date;
}

export interface Pets {
    id:            number;
    name:          string;
    sex:           string;
    age:           number;
    month:         number;
    currentWeight: number;
    photo:         null;
    sterilization: boolean;
    status:        string;
    createdAt:     Date;
    updatedAt:     Date;
    deleted_at:    null;
}
