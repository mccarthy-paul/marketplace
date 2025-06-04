import { v4 as uuidv4 } from 'uuid';

class Order {
  constructor(id, listing_id, buyer_id, order_date, status) {
    this.id = id;
    this.listing_id = listing_id;
    this.buyer_id = buyer_id;
    this.order_date = order_date;
    this.status = status;
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}

export default Order;
