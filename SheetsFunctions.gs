// Função chamada ao fim da votação para gerar a planilha de eleitores que votaram e o resultado das eleições. -----------------------------------------

SORT_DATA_RANGE = "A1:C998";
SORT_ORDER = [
{column: 1, ascending: true},  // 1 = column number, sorting by descending order
{column: 2, ascending: true}, // 2 = column number, sort by ascending order 
{column: 3, ascending: true}
];

function editSheet(linkSheet,numOpcoes,mesarioEmail,nomeEleicao,numMaxEscolhas,opcoes,dataInicio){
  
  var dataGeracaoPlanilha = new Date().toLocaleString('pt-BR');
  
  var sheet = SpreadsheetApp.openByUrl(linkSheet).getSheetByName('ResultadoFinal'); // Chama a planilha criada no início da votação.
  
    // ---------- Design do esqueleto da planilha -------------
  
  sheet.getRange('A1').setBackground('#008080').setValue('Eleitores').setFontWeight("bold").setFontColor('black');
  sheet.getRange('A1').setHorizontalAlignment([['center']]);
  sheet.getRange('A1:A300').setBorder(true,true,true,true,true,true);
  sheet.getRange('B1').setBackground('#008080').setValue('E-mails').setFontWeight("bold").setFontColor('black');
  sheet.getRange('B1').setHorizontalAlignment([['center']]);
  sheet.getRange('B1:B300').setBorder(true,true,true,true,true,true);
  sheet.getRange('C1').setBackground('#008080').setValue('Votos Realizados').setFontWeight("bold").setFontColor('black');
  sheet.getRange('C1').setHorizontalAlignment([['center']]);
  sheet.getRange('C1:C300').setBorder(true,true,true,true,true,true);
  
  sheet.getRange('E1').setBackground('#008080').setValue('Votos').setFontWeight("bold").setFontColor('black').setHorizontalAlignment('center').setBorder(true,true,true,true,true,true);
  sheet.getRange('E1:F1').merge();
  sheet.getRange('H1').setBackground('#f7a22e').setValue('Número de Eleitores Presentes').setFontWeight("bold").setFontColor('black').setHorizontalAlignment('center').setBorder(true,true,true,true,true,true);
  sheet.getRange('H2').setHorizontalAlignment('center').setBorder(true,true,true,true,true,true);
/*  var userProperties = PropertiesService.getUserProperties();
  var units = userProperties.getProperty('CHAVE').toString();
  sheet.getRange('H3').setHorizontalAlignment('center').setValue(units).setBorder(true,true,true,true,true,true); */
 // var sheet = SpreadsheetApp.openByUrl(linkPlanilha).getSheetByName('ResultadoFinal');
  
  for (var i = 0; i < numOpcoes; i++) {
    sheet.getRange(i+2,5).setBackground('#ffa500').setValue(opcoes[i]).setFontWeight("bold").setFontColor('black').setBorder(true,true,true,true,true,true);
    sheet.getRange(i+2,6).setBorder(true,true,true,true,true,true);
  }
  sheet.getRange(numOpcoes+2,5).setBackground('white').setValue('Abstenções').setFontWeight("bold").setFontColor('black').setBorder(true,true,true,true,true,true);
  sheet.getRange(numOpcoes+2,6).setBorder(true,true,true,true,true,true);
  sheet.getRange(numOpcoes+5,5).setBackground('cyan').setValue('Data de Início').setFontWeight("bold").setFontColor('black').setBorder(true,true,true,true,true,true);
  sheet.getRange(numOpcoes+6,5).setBackground('blue').setValue('Data de Término').setFontWeight("bold").setFontColor('white').setBorder(true,true,true,true,true,true);
  sheet.getRange(numOpcoes+5,6).setValue(dataInicio).setFontWeight("bold").setFontColor('black').setBorder(true,true,true,true,true,true);
  sheet.getRange(numOpcoes+6,6).setValue(dataGeracaoPlanilha).setFontWeight("bold").setFontColor('black').setBorder(true,true,true,true,true,true);
  
// Organiza a lista de eleitores, seus e-mails e votos. -----------------------------------------------------------------------------------------------
  
  var sheet2 = SpreadsheetApp.openByUrl(linkSheet).getSheetByName('DadosEnquete');
  var range = sheet2.getRange(SORT_DATA_RANGE);
  range.sort(SORT_ORDER);
  var numEleitores = sheet2.getLastRow();
  var sign = range.getValues(); // Pega os valores da lista auxiliar.
  if (numEleitores > 0) {
    var range = sheet2.getRange(1,2,numEleitores); // Coleta os e-mails dos eleitores.
    var listaEmails = range.getValues();
  }
  
  
// Grava os votos na planilha. -------------------------------------------------------------------------------------------------------------------------

  var sheet = SpreadsheetApp.openByUrl(linkSheet).getSheetByName('ResultadoFinal');
  sheet.getRange("A2:C999").setValues(sign); // Copia os valores da planilha auxiliar para a principal.
//  SpreadsheetApp.openByUrl(linkSheet).deleteSheet(sheet2); // Deleta a planilha auxiliar.
  // Realiza uma soma dos votos que foram, de fato, realizados.
  
  var voteCount = [0,0,0,0,0,0,0,0,0,0,0];
  for (var i = 0; i < numEleitores; i++) {
    var opcoesEleitor = sheet.getRange(i+2, 3).getValue();
    var opcoesEleitor2 = opcoesEleitor.split('$');
    var tam = opcoesEleitor2.length;
    for (var j = 0; j < tam; j++) {
      for (var k = 0; k < 11; k++) {

        if (opcoesEleitor2[j] == opcoes[k])
          voteCount[k] = parseInt(voteCount[k])+ 1;
      }
    }
  }
  
  
  var somaVotos = 0;
  for (var i = 0; i < numOpcoes; i++) {
    sheet.getRange(i+2,6).setValue(voteCount[i]);
    somaVotos = parseInt(somaVotos)+parseInt(voteCount[i]);
  }
  
  // Define o total de abstenções entre as abstenções explícitas e as abstenções não-explicítas em votação.
  var numMaxVotosPossiveis = parseInt(numEleitores*numMaxEscolhas);
  var abstencaoVazios = parseInt(numMaxVotosPossiveis) - parseInt(somaVotos) -  parseInt(voteCount[10])*numMaxEscolhas; 
  var totalAbstencoes = parseInt(abstencaoVazios) + numMaxEscolhas*parseInt(voteCount[10]);
  
  sheet.getRange(numOpcoes+2,6).setValue(totalAbstencoes); // Grava os votos abstentos
  sheet.getRange('H2').setValue(numEleitores).setFontWeight("bold").setFontColor('black');
  sheet.autoResizeColumns(1, 8);
  
// Comando de design e criação do gráfico de barras. ---------------------------------------------------------------------------------------------------
  if (numEleitores > 0) {
    var chartH1 = sheet.newChart()
    .asBarChart()
    .addRange(sheet.getRange(1,5,numOpcoes+3,2))
    .setNumHeaders(1)
    .setOption('useFirstColumnAsDomain', true)
    .setOption('legend.position', 'labeled')
    .setOption('isStacked', 'false')
    .setOption('title', 'Resultado')
    .setPosition(numOpcoes+9, 5, 3, 2)
    .setOption('height', 350)
    .setOption('width', 500)
    .setOption('hAxis.minValue', 0)
    .setOption('hAxis.maxValue', numEleitores*numMaxEscolhas)
    .build();
    sheet.insertChart(chartH1);
  }
// Gera PDF no drive do mesário. -----------------------------------------------------------------------------------------------------------------

  var id = SpreadsheetApp.openByUrl(linkSheet).getId();
  var spreadsheetFile = DriveApp.getFileById(id);
  var blob = spreadsheetFile.getAs('application/pdf');
  var file = DriveApp.createFile(blob);
  var urlpdf = file.getUrl();
  if (numEleitores > 0) {
    file.addViewers(listaEmails);
  }
  MailApp.sendEmail(mesarioEmail, 
                    'Resultado Votação ' + nomeEleicao, 'O resultado da votação' + nomeEleicao + 
                    ' pode ser visto no pdf em anexo!\n------------------------------------------\nMensagem auto-enviada por Coltekete!', 
                    {attachments: [file.getAs(MimeType.PDF)]});
  return urlpdf; // Retorna o link para download do PDF com o resultado da votação.
}


// Deleta a planilha caso a cédula seja apagada. -------------------------------------------------------------------------------------------------

function deleteSheet(linkPlanilha) {
  var id = SpreadsheetApp.openByUrl(linkPlanilha).getId();
  var file = DriveApp.getFileById(id);
  DriveApp.removeFile(file);
}
