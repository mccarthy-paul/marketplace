# Bulk Upload Guide

## Sample Inventory CSV

I've created a sample inventory CSV file (`sample-inventory.csv`) with 20 luxury watches that represents typical inventory from major brands:

### Included Brands:
- **Rolex**: Submariner, GMT-Master II, Daytona
- **Patek Philippe**: Nautilus, Aquanaut
- **Audemars Piguet**: Royal Oak, Royal Oak Offshore
- **Omega**: Speedmaster Professional, Seamaster
- **Cartier**: Santos, Tank Must
- **Tudor**: Black Bay Fifty-Eight, Black Bay GMT
- **IWC**: Portugieser Chronograph, Pilot's Watch
- **Jaeger-LeCoultre**: Reverso Classic
- **Panerai**: Luminor Marina
- **Breitling**: Navitimer
- **Vacheron Constantin**: Overseas
- **TAG Heuer**: Monaco

## How to Use This Sample Data

### Step 1: Prepare Images
Since we cannot directly scrape images from Chrono24 due to their protection, you have several options:

1. **Use placeholder images**:
   - Use any watch images you have
   - Name them according to the SKU pattern (e.g., ROL001_1.jpg, ROL001_2.jpg)

2. **Use stock images**:
   - Download royalty-free watch images
   - Rename them to match the SKUs in the CSV

3. **Use your own inventory images**:
   - Replace the sample data with your actual inventory
   - Use your own product photography

### Step 2: Image Naming Convention
Images must be named as: `SKU_NUMBER.extension`
- Example: `ROL001_1.jpg`, `ROL001_2.jpg`, `ROL001_3.jpg`
- Supports: JPG, JPEG, PNG, WebP
- Maximum 5 images per watch

### Step 3: Upload Process
1. Navigate to your Profile page
2. Click "Bulk Upload" button
3. Download the template or use the sample-inventory.csv
4. Upload the CSV file
5. Upload all corresponding images
6. Review the preview and validation
7. Click "Upload Inventory"

## CSV Fields Explained

### Required Fields:
- **SKU**: Unique identifier for each watch
- **Brand**: Manufacturer name
- **Model**: Model name
- **Reference_Number**: Manufacturer's reference number

### Optional Fields:
- **Year**: Year of manufacture
- **Condition**: Excellent, Very Good, Good, Fair
- **Description**: Detailed description of the watch
- **Price**: Sale price (leave empty for auction-only)
- **Starting_Bid**: Starting bid for auctions
- **Currency**: USD, EUR, GBP, CHF, etc.
- **Classifications**: Semicolon-separated categories
- **Case_Size**: Diameter in mm
- **Case_Material**: Stainless Steel, Gold, etc.
- **Dial_Color**: Color of the dial
- **Movement**: Automatic, Manual, Quartz
- **Bracelet_Material**: Strap/bracelet material
- **Box_Papers**: Both, Box Only, Papers Only, None
- **Image_1 to Image_5**: Image filenames

## Tips for Successful Bulk Upload

1. **Data Validation**:
   - Ensure SKUs are unique
   - Use valid years (1900-current year)
   - Price and Starting_Bid must be numbers
   - Classifications must match predefined categories

2. **Image Optimization**:
   - Recommended size: 1200x1200px minimum
   - File size: Under 10MB per image
   - Format: JPG for photos, PNG for transparent backgrounds

3. **Batch Size**:
   - Start with 10-20 watches for testing
   - Can handle up to 500 watches per upload
   - Large uploads may take several minutes

4. **Error Handling**:
   - The system will validate before processing
   - Fix any errors shown in red
   - Duplicate SKUs will be skipped
   - Failed items will be reported with reasons

## Sample Classifications

Use these classifications in your CSV (semicolon-separated):
- Automatic
- Dress
- Gold
- Men's
- Moon Phase
- Pocket
- Pre-Owned
- Skeleton
- Sports
- Women's

Example: "Sport;Diving;Men's"

## Alternative Data Sources

If you need to populate your inventory from existing data:

1. **Export from existing systems**:
   - Most inventory management systems can export to CSV
   - Map their fields to our template format

2. **Manual data entry**:
   - Use Excel or Google Sheets
   - Save as CSV when complete

3. **API Integration** (Coming Soon):
   - Programmatic upload via REST API
   - Webhook notifications
   - Scheduled imports

## Support

For any issues with bulk upload:
1. Check validation errors carefully
2. Ensure image names match exactly
3. Verify CSV encoding is UTF-8
4. Contact support with error messages

## Next Steps

1. Try uploading the sample-inventory.csv
2. Prepare your actual inventory data
3. Organize your product images
4. Start with a small test batch
5. Scale up to full inventory