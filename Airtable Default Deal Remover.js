//Get the record with the "Tag" field change
const inputConfig = input.config();
const productsTable = base.getTable("Deals");
const myRecord = await productsTable.selectRecordAsync(inputConfig.recordId);

//Get the recordID for the "New Product" Tag
const tagsTable = base.getTable("Properties");
const tagRecords = await tagsTable.selectRecordsAsync({fields: ['Property Address']});
console.log(tagRecords);
let [newProductTagRecord] = tagRecords.records.filter( record => (record.name === "Default Property   "));

//Logic for if the Tags Field is empty, in this case "null"
if (myRecord?.getCellValue("Properties") == null) {
    await productsTable.updateRecordAsync(inputConfig.recordId, {
        "Properties" : [{id: newProductTagRecord?.id}]
    })
} ;

//Logic for if the Tags Field is 2 or more tags, then remove the "New Product" tag.
if (myRecord.getCellValue("Properties").length >= 2) {
    
    let removeProductTagRecord = myRecord.getCellValue("Properties").filter( record => (record.name != "Default Property   "));
        
    await productsTable.updateRecordAsync(inputConfig.recordId, {
        "Properties" : removeProductTagRecord
    })
};
