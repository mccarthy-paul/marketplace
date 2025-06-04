import { v4 as uuidv4 } from 'uuid';

class Watch {
  constructor(id, brand, model, reference_number, description, year, condition) {
    this.id = id;
    this.brand = brand;
    this.model = model;
    this.reference_number = reference_number;
    this.description = description;
    this.year = year;
    this.condition = condition;
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}

export default Watch;
