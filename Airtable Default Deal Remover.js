// let inputConfig = input.config();
// let currentRecord = (inputConfig.recordID);
// let table = base.getTable("Deals");
// let field = table.getField("Properties");
// let queryResult = await table.selectRecordsAsync({fields: ["Properties"]});

// let results = queryResult.records;
// results.forEach(record => {
//   if (record.id == currentRecord) {
//     let selections = record.getCellValue("Properties");
//     propertiesCleaner(selections);
//   }
// });


// async function propertiesCleaner(choices) {
//   console.log(choices);
//   console.log(field);
//   console.log(field.options.choices);
//   await field.updateOptionsAsync(
//     { choices: [...field.options.choices.filter((choice) => choice.name !== "Default Property  ")] },
//     { enableSelectFieldChoiceDeletion: true }
//   );
// };

//Get the record with the "Tag" field change
const inputConfig = input.config();
const productsTable = base.getTable("Deals");
const myRecord = await productsTable.selectRecordAsync(inputConfig.recordID);

//Get the recordID for the "New Product" Tag
const tagsTable = base.getTable("Properties");
console.log(tagsTable);
const tagRecords = await tagsTable.selectRecordsAsync({fields: ["Address"]});
let [newProductTagRecord] = tagRecords.records.filter( record => (record.name === "New Product"));

//Logic for if the Tags Field is empty, in this case "null"
if (myRecord?.getCellValue("Properties") == null) {
    await productsTable.updateRecordAsync(inputConfig.recordID, {
        "Properties" : [{id: newProductTagRecord?.id}]
    })
} ;

//Logic for if the Tags Field is 2 or more tags, then remove the "New Product" tag.
if (myRecord.getCellValue("Properties").length >= 2) {
    
    let removeProductTagRecord = myRecord.getCellValue("Properties").filter( record => (record.name != "Default Property"));
        
    await productsTable.updateRecordAsync(inputConfig.recordID, {
        "Properties" : removeProductTagRecord
    })
};

