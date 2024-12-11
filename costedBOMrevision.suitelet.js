/**
* @NApiVersion 2.x
* @NScriptType Suitelet
* @NModuleScope Public
*/

/* 
Script Info
---Costed BOM Revision Inquiry---
A Suitelet utility for comparing Set/Average/LPP cost of Assembly Items

Tim Dietrich
	queryModule and SuiteQL
	timdietrich@me.com
	https://timdietrich.me
Scott Danesi
	Costed BOM SuiteQL
	https://www.scottdanesi.com/?p=5019
Compiled by crimes-johnson
	https://github.com/crimes-johnson

11-05-2020: Initial Suitelet by Tim Dietrich
09-27-2024: Compiled by Crimes Johnson
11-05-2024: Updated to fix a change by NetSuite to BOM records
*/

var 
	log,
	query,
	serverWidget,
	historyRows = 100;


define( [ 'N/log', 'N/query', 'N/ui/serverWidget' ], main );


function main( logModule, queryModule, serverWidgetModule ) {

	// Set module references.
	log = logModule;
	query= queryModule;
	serverWidget = serverWidgetModule;				
	
    return {
    
    	onRequest: function( context ) {
    	
			// Create a form.
			var form = serverWidget.createForm(
				{
					title: 'Costed BOM Revision Inquiry',
					hideNavBar: false
				}
			);		
			
			// Add a submit button.
			form.addSubmitButton( { label: 'Get Cost' } );
			
			// Add a "BOM Revision ID" field.
			var revField = form.addField(
				{
					id: 'custpage_field_revid',
					type: serverWidget.FieldType.TEXT,
					label: 'Revision Name'
				}								
			);					
			
			// Make the search field mandatory.
			revField.isMandatory = true;			
											
			// If the form has been submitted...
			if ( context.request.method == 'POST' ) {	
			
				// Set defaults for the item and date field values.
				revField.defaultValue = context.request.parameters.custpage_field_revid;			

				// Process the form.
				formProcess( context, form );
			
			}
			
			// Display the form.
			context.response.writePage( form );	
			
        }
        
    }

}

// SuiteQL query to submit
function formProcess( context, form ) {	

	var theQuery = '';
	theQuery += 'SELECT ';
	theQuery += 't2.fullname as "assembly name", ';
	theQuery += 't2.displayName as "assembly description", ';
	theQuery += 'bomRevision.name as "bom revision", ';
	theQuery += 'item.itemId as "component Name", ';
	theQuery += 'BomRevisionComponent.description as "description", ';
	theQuery += 'BomRevisionComponent.bomQuantity as "quantity", ';
	theQuery += 'to_char( item.cost, \'$9,999.99\' ) as "set cost", ';
	theQuery += 'to_char( CASE WHEN item.averageCost = 0 THEN item.cost ELSE item.averageCost END, \'$9,999.99\' ) as "average cost", ';
	theQuery += 'to_char( BomRevisionComponent.bomQuantity * CASE WHEN item.averageCost = 0 THEN item.cost ELSE item.averageCost END, \'$9,999.99\' ) as "avg cost total", ';
	theQuery += 'to_char( CASE WHEN item.lastPurchasePrice = 0 THEN item.cost ELSE item.averageCost END, \'$9,999.99\' ) as "last purchase price", ';
	theQuery += 'to_char( BomRevisionComponent.bomQuantity * CASE WHEN item.lastPurchasePrice = 0 THEN item.cost ELSE item.averageCost END, \'$9,999.99\' ) as "last purchase total", ';
	theQuery += 't1.altName  as "preferred vendor" ';
	theQuery += 'FROM ';
	theQuery += 'BomRevisionComponent ';
	theQuery += 'LEFT JOIN item ON BomRevisionComponent.item = item.id ';
	theQuery += 'LEFT JOIN bomRevision ON BomRevisionComponent.bomrevision = bomRevision.id ';
	theQuery += 'LEFT JOIN ';
	theQuery += '( ';
	theQuery += 'SELECT ';
	theQuery += 'itemVendor.item, ';
	theQuery += 'itemVendor.preferredVendor, ';
	theQuery += 'itemVendor.vendor, ';
	theQuery += 'Vendor.altname ';
	theQuery += 'FROM ';
	theQuery += 'itemVendor ';
	theQuery += 'LEFT JOIN Vendor ON itemVendor.vendor = Vendor.id ';
	theQuery += 'WHERE ';
	theQuery += 'itemVendor.preferredVendor = \'T\' ';
	theQuery += ') as t1 ';
	theQuery += 'ON t1.item = item.id ';
	theQuery += 'LEFT JOIN ';
	theQuery += '( ';
	theQuery += 'SELECT ';
	theQuery += 'item.fullName, ';
	theQuery += 'item.displayName, ';
	theQuery += 'item.id, ';
	theQuery += 'bomRevision.name ';
	theQuery += 'FROM ';
	theQuery += 'item ';
	theQuery += 'JOIN itemAssemblyItemBom ON item.id = itemAssemblyItemBom.assembly '; //NetSuite changed the default record from bomAssembly to itemAssemblyItemBom in 2024.2 release
	theQuery += 'JOIN bom ON itemAssemblyItemBom.billofmaterials = bom.id ';
	theQuery += 'JOIN bomRevision ON bomRevision.billofmaterials = bom.id ';
	theQuery += ') as t2 ';
	theQuery += 'ON t2.name = bomRevision.name ';
	theQuery += 'WHERE bomRevision .name = \'' + context.request.parameters.custpage_field_revid + '\' ';
	theQuery += 'UNION ';
	theQuery += 'SELECT ';
	theQuery += 'NULL as "assembly name", ';
	theQuery += 'NULL as "assembly description", ';
	theQuery += 'NULL as "bom revision", ';
	theQuery += 'NULL as "component name", ';
	theQuery += '\'Total Cost\' as "description", ';
	theQuery += 'NULL  as "quantity", ';
	theQuery += 'to_char( SUM(BomRevisionComponent.bomQuantity * item.cost), \'$9,999.99\' ) as "set cost total", ';
	theQuery += 'NULL  as "average cost", ';
	theQuery += 'to_char( SUM(BomRevisionComponent.bomQuantity * CASE WHEN item.averageCost = 0 THEN item.cost ELSE item.averageCost END), \'$9,999.99\' ) as "avg cost total", ';
	theQuery += 'NULL as "last Purchase Price", ';
	theQuery += 'to_char( SUM(BomRevisionComponent.bomQuantity * CASE WHEN item.lastPurchasePrice = 0 THEN item.cost ELSE item.averageCost END), \'$9,999.99\' ) as "last purchase total", ';
	theQuery += 'NULL as "preferred vendor" ';
	theQuery += 'FROM ';
	theQuery += 'BomRevisionComponent ';
	theQuery += 'LEFT JOIN item ON BomRevisionComponent.item = item.id ';
	theQuery += 'LEFT JOIN bomRevision ON BomRevisionComponent.bomrevision = bomRevision.id ';
	theQuery += 'WHERE bomRevision .name =  \'' + context.request.parameters.custpage_field_revid + '\' ';		
	
	try {

		// Run the query.
		var queryResults = query.runSuiteQL(
			{
				query: theQuery
			}
		); 				
	
		// Get the mapped results.		
		var records = queryResults.asMappedResults();				
	
		// If records were returned...
		if ( records.length > 0 ) {	

			// Create a sublist for the results.
			var resultsSublist = form.addSublist(
				{ 
					id : 'results_sublist', 
					label : 'Revision Components List', 
					type : serverWidget.SublistType.LIST 
				}
			);

			// Get the column names.
			var columnNames = Object.keys( records[0] );

			// Loop over the column names...
			for ( i = 0; i < columnNames.length; i++ ) {

				// Add the column to the sublist as a field.
				resultsSublist.addField(
					{ 
						id: 'custpage_results_sublist_col_' + i,
						type: serverWidget.FieldType.TEXT,
						label: columnNames[i]
					}
				);

			}

			// Add the records to the sublist...
			for ( r = 0; r < records.length; r++ ) {

				// Get the record.
				var record = records[r];

				// Loop over the columns...
				for ( c = 0; c < columnNames.length; c++ ) {

					// Get the column name.
					var column = columnNames[c];

					// Get the column value.
					var value = record[column];
					
					// If the column has a value...
					if ( value != null ) {
					
						// Get the value as a string.
						value = value.toString();
						
						// If the value is too long to be displayed in the sublist...
						if ( value.length > 300 ) {
						
							// Truncate the value.
							value = value.substring( 0, 297 ) + '...';			
							
						}

						// Add the column value.		
						resultsSublist.setSublistValue(
							{
								id : 'custpage_results_sublist_col_' + c,
								line : r,
								value : value
							}
						);        

					}	
					
				}

			}			

		} else {
		
			// Add an "Error" field.
			var errorField = form.addField(
				{
					id: 'custpage_field_error',
					type: serverWidget.FieldType.TEXT,
					label: 'Error'
				}								
			);		
			
			errorField.defaultValue = 'No revision found for: ' + context.request.parameters.custpage_field_revid;	
			
			// Add an inline HTML field so that JavaScript can be injected.
			var jsField = form.addField(
				{
					id: 'custpage_field_js',
					type: serverWidget.FieldType.INLINEHTML,
					label: 'Javascript'
				}								
			);		
			
			// Add Javascript to make the error field red.
			jsField.defaultValue = '<script>\r\n';
			jsField.defaultValue += 'document.addEventListener(\'DOMContentLoaded\', function() {';
			jsField.defaultValue += 'document.getElementById("custpage_field_error").style.background="red";\r\n';
			jsField.defaultValue += 'document.getElementById("custpage_field_error").style.color="white";\r\n';
			jsField.defaultValue += '}, false);';
			jsField.defaultValue += '</script>';					
		
		}

	} catch( e ) {	
	
		var errorField = form.addField(
			{
				id: 'custpage_field_error',
				type: serverWidget.FieldType.LONGTEXT,
				label: 'Error'
			}								
		);		
	
		errorField.defaultValue = e.message;			
		
	}

}