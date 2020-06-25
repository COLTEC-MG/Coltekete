// Linha: Nome; E-mail; Opcoes Escolhidas; Nº de Cliques

function gravaDados(nomeEleitor,emailEleitor,opcao,linkPlanilha) {
  
  var sheet = SpreadsheetApp.openByUrl(linkPlanilha);
  var sheetPage = SpreadsheetApp.openByUrl(linkPlanilha).getSheetByName('DadosEnquete');
  var procurar = sheetPage.createTextFinder(emailEleitor);
  var linha = procurar.findNext();
  var ultimaLinha = sheetPage.getLastRow();
  
  if (linha != null) {
    var linhaUser = linha.getRow();
    var opcoes = sheetPage.getRange(linhaUser,3).getValue();
    if (opcoes == 0 || opcao == 'abstenção') {
      sheetPage.getRange(linhaUser,3).setValue(opcao);
      sheetPage.getRange(linhaUser,1).setValue(nomeEleitor);
    }
    else {
      var opcoesTotais = opcoes.split('$');
      opcoesTotais.push(opcao);
      var opcoesTotais2 = opcoesTotais.join(['$']);
      sheetPage.getRange(linhaUser,3).setValue(opcoesTotais2);
      sheetPage.getRange(linhaUser,1).setValue(nomeEleitor);
    }
  }
  else {
    sheetPage.getRange(ultimaLinha+1,1).setValue(nomeEleitor);
    sheetPage.getRange(ultimaLinha+1,2).setValue(emailEleitor);
    sheetPage.getRange(ultimaLinha+1,3).setValue(opcao);
  }
  return
}
