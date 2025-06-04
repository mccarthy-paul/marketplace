import { v4 as uuidv4 } from 'uuid';

class User {
  constructor(id, juno_id, email, name, company_name, is_admin) {
    this.id = id;
    this.juno_id = juno_id;
    this.email = email;
    this.name = name;
    this.company_name = company_name;
    this.is_admin = is_admin;
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}

export default User;
