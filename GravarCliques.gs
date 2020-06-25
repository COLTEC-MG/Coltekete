function gravaCliques(emailEleitor,linkPlanilha) {
 
  var sheet = SpreadsheetApp.openByUrl(linkPlanilha);
  var sheetPage = SpreadsheetApp.openByUrl(linkPlanilha).getSheetByName('DadosEnquete');
  var procurar = sheetPage.createTextFinder(emailEleitor);
  var linha = procurar.findNext();
  var ultimaLinha = sheetPage.getLastRow();
  
  if (linha != null) {
    var linhaUser = linha.getRow();
    var nCliques = sheetPage.getRange(linhaUser,4).getValue();
    var newCliques = nCliques + 1;
    sheetPage.getRange(linhaUser,4).setValue(newCliques); 
  }
  else {
    sheetPage.getRange(ultimaLinha+1,2).setValue(emailEleitor);
    var nCliques = sheetPage.getRange(ultimaLinha+1,4).getValue();
    var newCliques = nCliques + 1;
    sheetPage.getRange(ultimaLinha+1,4).setValue(newCliques);
  } 
  return newCliques
}
