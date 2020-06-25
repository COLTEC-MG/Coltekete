function votosRealizados(emailEleitor,linkPlanilha) {
  
  var sheet = SpreadsheetApp.openByUrl(linkPlanilha);
  var sheetPage = SpreadsheetApp.openByUrl(linkPlanilha).getSheetByName('DadosEnquete');
  var procurar = sheetPage.createTextFinder(emailEleitor);
  var linha = procurar.findNext();
  var ultimaLinha = sheetPage.getLastRow();
  
  if (linha != null) {
    var linhaUser = linha.getRow();
    var opcoes = sheetPage.getRange(linhaUser,3).getValue();
    if (opcoes == 0) {
      return 0
    }
    else {
      var opcoesTotais = opcoes.split('$');
      var tam = opcoesTotais.length;
      return tam
    }
  }
  else {
    return 0
  }
}

