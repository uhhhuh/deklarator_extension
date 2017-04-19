var $xml;
var persons = [];
var selectedPerson;
var currentPerson;
var currentOverallIncome;
var selectedRealty;
var selectedTransport;
var currentOverallRealty;
var currentPersonRealty;
var currentOverallTransport;
var delay = 100;
var relationType;
var countriesMapping = {1: 26, 2: 6, 3: 34, 4: 31, 5: 33, 6: 1, 7: 3, 8: 4 };
var realtyTypeMapping = {1: 1, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 4, 8: 6, 9: 1, 10: 3, 11: 3, 12 :3, 13: 3, 14: 5, 15: 5, 16: 5, 17: 2};
var ownershipTypeMapping = {1: 1, 2: 3, 3: 2};

$( document ).ready( function() { 
	console.log('page ready 2');
	$('h1').before("<div id='parserContainer'></div>");
	$('#parserContainer').append("<form id='xmlform' type='POST'></form>");
	$('#xmlform').append("<span style='font-size: 14px'>Загрузить XML</span><br/>");
	$('#xmlform').append("<input type='file' id='loadxml' accept='.xml' style='margin-top:10px' />");
	//$('#xmlform').append("<input type='submit' style='margin-left:50px' />");
	$('#loadxml').change( function(e){ $('#xmlform').submit() });
	$('#xmlform').css('margin-left','5px');
	$('#xmlform').css('margin-top','20px');
	$('#parserContainer').append("<span id='currentOrganName'></span>");
	$('#currentOrganName').hide();
	$('#parserContainer').append("<span id='fillingFinished'><br>Заполнение формы завершено<br/>Теперь необходимо перейти в раздел «<a href='#' id='transportLink'>Транспортные средства</a>» и заполнить его согласно подсказкам на красном фоне</span>");
	$('#transportLink').click(function(){
		$('html, body').animate({
			scrollTop: $("h2:contains('Транспортные средства')").offset().top
		}, 2000);
	});
	$('#fillingFinished').hide();

	$('#parserContainer').append("<span id='waitingForPersonInput'><br/>Ожидание выбора чиновника</span>");
	$('#waitingForPersonInput').hide();

	$("#parserContainer").append("<hr style='margin-top:20px; margin-left:-50px'>");
	$('#xmlform').hide();
	
	$('#xmlform').submit(function(e){
		$('#xmlform').hide();
		$('#waitingForPersonInput').show();
		var file = $('#loadxml')[0].files[0];
		

		var reader = new FileReader();
		reader.onload = function(evt){
			organName = file.name.replace(".xml","");
			console.log('FILE NAME: ' + file.name.replace(".xml",""));
			var xmlText = evt.target.result;
			//console.log("XML Text read:\n" + xmlText);
			chrome.runtime.sendMessage({type: "write", name: organName, text: xmlText});
			$('#currentOrganName').html("<br/>Вы вводите данные для:<br/><span style='font-style:italic; font-size:16px'>"+organName+"</span><br/><a href='#' id='changeXml'>Изменить XML</a><br/>");
			$('#changeXml').click(function(){
				$('#currentOrganName').hide();
				$('#xmlform').show();
				$('#selectPersonContainer').remove();
			});
			$('#currentOrganName').show();
			readXmlFile(xmlText);			
		};
		reader.readAsText(file);
		e.preventDefault();
	});
	$('#autocomp-officials').css('top', '242px');
	$('.submit_buttons').css('margin-top', '10px');

	chrome.runtime.sendMessage({type: "read"}, function(response) {
		//console.log(response.text);
		if(typeof response.text == 'undefined'){
			console.log('NO XML DEFINED YET');
			$('#xmlform').show();
		}
		else{
			$('#currentOrganName').html("<br/>Вы вводите данные для:<br/><span style='font-style:italic; font-size:16px'>"+response.name+"</span><br/><a href='#' id='changeXml'>Изменить XML</a><br/>");
			$('#changeXml').click(function(){
				$('#currentOrganName').hide();
				$('#xmlform').show();
				$('#selectPersonSelect').empty();
				$('#selectPersonContainer').remove();
			});
			$('#currentOrganName').show();
			readXmlFile(response.text);
		}
	});
	
	
});
function readXmlFile(xmlText){
	xmlDoc = $.parseXML( xmlText );
	$xml = $( xmlDoc) ;		
	console.log("total persons: " + $xml.find('person').length);
	persons = [];
	$xml.find('person').each( function(idx){
		nameElem = $( this ).find('name');
		attr = $(this).find('relativeOf').attr('xsi:nil');
		if (attr == 'true'){
			console.log(idx + " " + $( this ).find('name').text());
			persons.push({id: $( this ).find('id').text(), name: $( this ).find('name').text()} );
		}
		else{
			console.log(idx + " is a relative");
		}
	});
	persons = persons.sort(function (a, b) {
		return a.name.localeCompare( b.name );
	});
	$('hr').before('<div id="selectPersonContainer" style="margin-top:10px"></div>');
	
	$('#selectPersonContainer').append("<form id='selectPersonForm' type='POST' style='margin-top:10px'></form>");
	$('#selectPersonForm').append("<span style='font-style: italic'>Выберите чиновника из XML:</span><br/>");
	$('#selectPersonForm').append("<select name='selectedPerson' id='selectPersonSelect' size='5' style='width:200px;'></select><br/>");
	var i = 1;
	//persons.sort();
	console.log(persons);
	for (var i = 0; i < persons.length; i++){
		$('select[name=selectedPerson]').append("<option value='"+persons[i]['id']+"'>"+persons[i]['name']+"</option>");
	};
	$('#selectPersonForm').append("<input type='submit' >");
	$('#selectPersonSelect').dblclick(function(e){ $('#selectPersonForm').submit() })

	$('#id_main_block_button').click(function(e){
		$('#selectPersonContainer').show();
	});
	$('#selectPersonForm').submit(function(e){
		e.preventDefault();	
		$('#selectPersonContainer').hide();
		$('#id_main_block_button').off()

		var chosenId = $('select[name=selectedPerson]').val();
		$('#id_main_block_button').click();
		
		$xml.find('person').each( function(idx){
			if ( $(this).find('id').text() == chosenId ){
				selectedPerson = $(this);		
				return false;
			}
		});
		$('#id_position').val(selectedPerson.find('position').text());
		currentPerson = 0;
		currentOverallRealty = 0;
		currentOverallTransport = 0;
		currentOverallIncome = 0;
		
		setTimeout(fillData, delay);
		
		$('#id_main_block_button').click();
	});
	$('#selectPersonContainer').hide();
}

function fillData(){
	console.log(currentPerson + ' income is: ' + selectedPerson.find('income').text());
	currentPersonRealty = 0;
	console.log('determining relation type');
	if(selectedPerson.find('relationType').attr('xsi:nil') !== 'true'){
		var xmlRelationType = parseInt(selectedPerson.find('relationType').text());
		relationType = ( xmlRelationType == 1 || xmlRelationType == 2 ) ? 2 : 6;
	}
	else{
		relationType = 0;
	}
	if(selectedPerson.find('income').attr('xsi:nil') !== 'true'){
		$('#id_add_incomes_button').click();
		setTimeout(chooseRelationTypeIncome, delay);
	}
	else{
		if(selectedPerson.find('realties').attr('xsi:nil') !== 'true'){
			selectedRealty = selectedPerson.find('realties').find('realty').eq(0);
			setTimeout(fillRealty, delay);
		}
		else{
			console.log(currentPerson + ' does not have realties');
			if(selectedPerson.find('transports').attr('xsi:nil') !== 'true'){
				selectedTransport = selectedPerson.find('transports').find('transport').eq(0);
				setTimeout(fillTransport, delay);
			}
			else{
				if(!(selectedPerson.next().find('relativeOf').attr('xsi:nil') === 'true' || selectedPerson.next().length === 0 )){
					selectedPerson = selectedPerson.next();
					currentPerson++;
					setTimeout(fillData,delay);
				}
				else{
					$('#waitingForPersonInput').hide();
					$('#fillingFinished').show();					
					$("html, body").animate({ scrollTop: 0 }, "slow");
					console.log('FINISHED');
				}
			}
		}
	}
}
function chooseRelationTypeIncome(){
	if(relationType !== 0){
		console.log('choosing relation type - income');
		var selectCssSelector = "select#id_incomes-"+currentOverallIncome+"-relative";
		var optionCssSelector = "option[value='"+relationType+"']";
		$(selectCssSelector + " > " + optionCssSelector).attr('selected','selected');
	}
	setTimeout(fillIncomeComment, delay);
}
function fillIncomeComment(){
	//console.log('filling income comment');
	var incomeComments = [];
	if(selectedPerson.find('incomeComment').attr('xsi:nil') !== 'true'){
		incomeComments.push(selectedPerson.find('incomeComment').text());
	}
	if(selectedPerson.find('incomeSource').attr('xsi:nil') !== 'true'){
		incomeComments.push(selectedPerson.find('incomeSource').text());
	}
	var fullCommentText = incomeComments.join('; ');
	if (fullCommentText !== ""){
		$('#id_incomes-'+currentOverallIncome+'-comment').val(fullCommentText);
	}
	setTimeout(fillIncomeField, delay);
}
function fillIncomeField(){
	console.log('filling income'); 
	$('#id_incomes-'+currentOverallIncome+'-size').val(selectedPerson.find('income').text());
	setTimeout(finalizeIncome, delay);
}
function finalizeIncome(){
	console.log('finalizing income');
	$('#id_incomes-'+currentOverallIncome+'_block_button').click(); 
	currentOverallIncome++;
	if(selectedPerson.find('realties').attr('xsi:nil') !== 'true'){
		selectedRealty = selectedPerson.find('realties').find('realty').eq(0);
		setTimeout(fillRealty, delay);
	}
	else{
		if(selectedPerson.find('transports').attr('xsi:nil') !== 'true'){
			selectedTransport = selectedPerson.find('transports').find('transport').eq(0);
			setTimeout(fillTransport, delay);
		}
		else{
			if(!(selectedPerson.next().find('relativeOf').attr('xsi:nil') === 'true' || selectedPerson.next().length === 0 )){
				selectedPerson = selectedPerson.next();
				currentPerson++;
				setTimeout(fillData,delay);
			}
			else{
				$('#waitingForPersonInput').hide();
				$('#fillingFinished').show();					
				$("html, body").animate({ scrollTop: 0 }, "slow");
				console.log('FINISHED');
			}
		}
	}
}
function fillRealty(){
	$('#id_add_realestates_button').click();
	setTimeout(chooseRelationTypeRealty, delay);

}
function chooseRelationTypeRealty(){
	if(relationType !== 0){
		var selectCssSelector = "select#id_realestates-"+currentOverallRealty+"-relative";
		var optionCssSelector = "option[value='"+relationType+"']";
		$(selectCssSelector + " > " + optionCssSelector).attr('selected','selected');
	}
	setTimeout(clickMoreRealtyInfoButton, delay);
}
function clickMoreRealtyInfoButton(){
	$("#id_realestates-"+currentOverallRealty+"_extra_info_button").click();
	setTimeout(chooseOwnershipTypeRealty, delay);
}
function chooseOwnershipTypeRealty(){
	console.log('type of selectedRealty: ' + selectedRealty.find('realtyType').text() );
	var xmlRealtyType = parseInt(selectedRealty.find('realtyType').text());
	realtyType = (xmlRealtyType == 1) ? 1 : 9;
	var selectCssSelector = "select#id_realestates-"+currentOverallRealty+"-owntype";
	var optionCssSelector = "option[value='"+realtyType+"']";
	$(selectCssSelector + " > " + optionCssSelector).attr('selected','selected');
	setTimeout(fillSquare, delay);
}
function fillSquare(){
	$('#id_realestates-'+currentOverallRealty+'-square').val(selectedRealty.find('square').text());
	setTimeout(chooseCountry, delay);
}
function chooseCountry(){
	var selectCssSelector = "select#id_realestates-"+currentOverallRealty+"-country";
	var optionCssSelector = "option[value='"+countriesMapping[selectedRealty.find('country').text()]+"'";
	$(selectCssSelector + " > " + optionCssSelector).attr('selected','selected');
	setTimeout(chooseRealtyType, delay);
}
function chooseRealtyType(){
	var selectCssSelector = "select#id_realestates-"+currentOverallRealty+"-type";
	var optionCssSelector = "option[value='"+realtyTypeMapping[selectedRealty.find('objectType').text()]+"'";
	$(selectCssSelector + " > " + optionCssSelector).attr('selected','selected');
	setTimeout(chooseOwnershipType, delay);
}
function chooseOwnershipType(){
	var selectCssSelector = "select#id_realestates-"+currentOverallRealty+"-sharetype";
	var optionCssSelector = "option[value='"+ownershipTypeMapping[selectedRealty.find('ownershipType').text()]+"'";
	$(selectCssSelector + " > " + optionCssSelector).attr('selected','selected');
	if(selectedRealty.find('ownershipPart').attr('xsi:nil') !== 'true'){
		setTimeout(setOwnershipPart, delay);
	}
	else{
		setTimeout(finalizeRealty, delay);
	}
}
function setOwnershipPart(){
	$("#id_realestates-"+currentOverallRealty+"-share").val(selectedRealty.find('ownershipPart').text());
	setTimeout(finalizeRealty, delay);
}
function finalizeRealty(){
	$("#id_realestates-"+currentOverallRealty+"_block_button").click();
	currentOverallRealty++;
	currentPersonRealty++;
	console.log('next realty is: ' + selectedRealty.next());
	if(selectedRealty.next().length !== 0){
		selectedRealty = selectedRealty.next();
		setTimeout(fillRealty, delay);	
	}
	else{
		if(selectedPerson.find('transports').attr('xsi:nil') !== 'true'){
			selectedTransport = selectedPerson.find('transports').find('transport').eq(0);
			setTimeout(fillTransport, delay);
		}
		else{
			if(!(selectedPerson.next().find('relativeOf').attr('xsi:nil') === 'true' || selectedPerson.next().length === 0 )){
				selectedPerson = selectedPerson.next();
				currentPerson++;
				setTimeout(fillData,delay);
			}
			else{
				$('#waitingForPersonInput').hide();
				$('#fillingFinished').show();					
				$("html, body").animate({ scrollTop: 0 }, "slow");
				console.log('FINISHED');
			}
		}
	}
}
function fillTransport(){
	console.log('filling transport');
	console.log('transport is: ' + selectedTransport.find('transportName').text());
	$('#id_add_vehicles_button').click();
	setTimeout(chooseRelationTypeTransport, delay);
}
function chooseRelationTypeTransport(){
	if(relationType !== 0){
		console.log('choosing relation type - transport: num ' + currentOverallTransport);
		
		var selectCssSelector = "select#id_vehicles-"+currentOverallTransport+"-relative";
		var optionCssSelector = "option[value='"+relationType+"']";
		$(selectCssSelector + " > " + optionCssSelector).attr('selected','selected');
	}	
	setTimeout(insertTransportHint, delay);
}
function insertTransportHint(){
	$("#id_vehicles-"+currentOverallTransport+"_table").prepend('<div style="padding:5px; color: white; background: darkred">↓↓ '+ selectedTransport.find('transportName').text() +'</div>')
	setTimeout(finalizeTransport, delay);
}
function finalizeTransport(){
	$("#id_vehicles-"+currentOverallTransport+"_block_button").click();
	currentOverallTransport++;
	if(selectedTransport.next().length !== 0){
		selectedTransport = selectedTransport.next();
		setTimeout(fillTransport, delay);	
	}
	else{
		if(!(selectedPerson.next().find('relativeOf').attr('xsi:nil') === 'true' || selectedPerson.next().length === 0 )){
			selectedPerson = selectedPerson.next();
			currentPerson++;
			setTimeout(fillData,delay);
		}
		else{
			$('#waitingForPersonInput').hide();
			$('#fillingFinished').show();					
			$("html, body").animate({ scrollTop: 0 }, "slow");
			console.log('FINISHED');
		}
	}
}


