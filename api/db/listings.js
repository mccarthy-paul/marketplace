import { v4 as uuidv4 } from 'uuid';

class Listing {
  constructor(id, watch_id, seller_id, price, is_available) {
    this.id = id;
    this.watch_id = watch_id;
    this.seller_id = seller_id;
    this.price = price;
    this.is_available = is_available;
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}

export default Listing;
