function buscaVoto(emailEleitor,opcao, linkPlanilha) {
  
  var sheet = SpreadsheetApp.openByUrl(linkPlanilha);
  var sheetPage = SpreadsheetApp.openByUrl(linkPlanilha).getSheetByName('DadosEnquete');
  var procurar = sheetPage.createTextFinder(emailEleitor);
  var linha = procurar.findNext();
  var ultimaLinha = sheetPage.getLastRow();
  
  if (linha != null) {
    var linhaUser = linha.getRow();
    var opcoes = sheetPage.getRange(linhaUser,3).getValue();
    opcoes = opcoes.toString();
    var opcoesTotais = opcoes.split('$');
    var tam = opcoesTotais.length;
    for (var i = 0; i < tam; i++) {
      if (opcoesTotais[i] == opcao) {
        return true
      }
    }
  }
  else {
    return false
  } 
  return false
}
