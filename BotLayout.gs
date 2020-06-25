/* Esse código foi desenvolvido por Dener Brandão, estagiário em docência em 2019/2020, e Rafael Costa, 
   graduando em Engenharia de Controle e Automação em 2020.

   Tem por objetivo a implementação do Coltekete, um bot para o Hangouts Chat, uma plataforma do G Suite para reuniões e conversa.
*/

// Carrega as imagens que serão utilizadas no bot. ---------------------------------------------------------


var DEFAULT_IMAGE_URL = 'https://goo.gl/bMqzYS';
var IMAGE_COLTEC = 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Coltec_Image.jpg';

// -------- Cabeçalho inicial do bot -------------------------------------------------------------------
var HEADER = {
  header: {
    title : 'Coltekete',
    subtitle : 'Criar uma votação.',
    imageUrl : IMAGE_COLTEC
  }
};

// Função chamada quando o bot é adicionado a uma sala ou chamado em DM.
function onAddToSpace(event) {
  var message = '<b>Coltekete adicionado à sala ' + event.space.displayName + '!</b>';
  
  console.info(event);
  return {
    actionResponse: {
      type: 'NEW_MESSAGE'
    },
    cards: [{
      
      //  ------------- Cartão 1 ------------------------------------
      
      header: {
        title: 'Bem-vindo ao Coltekete!',
        subtitle : 'Assessor de eleições do COLTEC!',
        imageUrl : IMAGE_COLTEC
      },
      sections: [{
        
        // -------------- Seção 1 do cartão 1 --------------------------
        
        widgets: [{
          textParagraph: {
            text: message,
          }
        }]
      }]
    }]
  } 
}


// Função "onMessage" é executada quando manda uma mensagem na DM pro bot ou quando marca ele em alguma sala.
// Quem chama essa função na votação é automaticamente definido como mesário.
// Nessa função é criada a planilha no Drive do mesário, que é quem passa os dados para o bot.
function onMessage(e) {
  
  if (e.space.type == "DM" && e.message.text != "help"){
    var message = 'Olá, eu já estou configurado! Para mais detalhes, envie *help* para mim.';
    
    return { "text": message };
  }
  
  try {
    var options = { month: 'long', day: 'numeric',hour: 'numeric',minute: 'numeric'};
    var dataInicio = new Date().toLocaleString('pt-BR');
    var parametrosEleicao = e.message.text; // Pega os parâmetros passados pelo usuário para iniciar a votação.
    parametrosEleicao = parametrosEleicao.replace('@Coltekete ',''); // Retira dos parâmetros a marcação do bot.
    if (parametrosEleicao == 'help') {
      var message = "Olá, eu sou o Coltekete, o assessor de votações do Coltec!\n" +
        "A votação pode ter até 10 opções e pode-se definir qual a quantidade máxima de votos que cada eleitor pode ter, sem repetir a escolha. A votação, portanto, deve conter: \n" +
          "1. Nome da Eleição.\n 2. Número máximo de escolhas por eleitor.\n 3. Opções de Voto. \n 4. Data de Término\n" +
            "Para iniciar a votação, deve-se inserir os campos da seguinte forma: \n" +
              "<Nome da Votação><Número Máximo de Escolhas (1 a 10)><Opção1 $ Opção 2 $ Opção 3 $ ... $ Opção 10><Data de Término>\n" +
                "Observe que os parâmetros da votação são divididos por <> e as opções por $ ! Não se esqueça disso! \n" +
                  "Em salas, você deve marcar o Coltekete dessa forma: @Coltekete antes de iniciar a escrita dos parâmetros!\n" +
                    "Preencha apenas o número de opções que a sua votação tiver! Boa eleição! :)";
      return {"text": message}
    }
    var mesario = e.user.displayName;
    var mesarioEmail = e.user.email;
    
    parametrosEleicao = parametrosEleicao.replace(/</g,''); // Retira os caracteres de <
    var parEleicao = parametrosEleicao.split('>',4); // Divide os parâmetros da eleição em 4 partes.
    var nomeEleicao = parEleicao[0];
    var numMaxEscolhas = parEleicao[1];
    var opcoes = parEleicao[2].split('$');
    var numOpcoes = opcoes.length;
    var dataTermino = parEleicao[3]; 
    
    // Variáveis criadas para verificar se a data de início é superior à data final estabelecida pelo usuário.
    var dataTerminoTeste = new Date(dataTermino).getTime();
    var dataInicioTeste = new Date().getTime();
    
    /* var userProperties = PropertiesService.getUserProperties();
    var chave = dataInicio.toString(); 
    userProperties.setProperty('CHAVE', chave); */
    
    // Caso não sejam inseridos todos os parâmetros necessários para iniciar a votação.
    if (parEleicao.length != 4) {
      return { text: 'Preenchimento incorreto dos parâmetros de votação! Tente novamente! ' +
              'Ex: <Nome Votação><Número máx de escolhas><Chapa1$Chapa2$Chapa3$...$Chapa10><Data de término da votação>'}
    }
    // Caso o número de escolhas seja maior que o número de opções
    else if (numMaxEscolhas > numOpcoes) {
      return { text: 'O número máximo de escolhas é maior que o número de opções! Tente novamente!'}
    }
    // Caso o número de escolhas seja menor que 1.
    else if (numMaxEscolhas < 1) {
      return { text: 'O número mínimo de escolhas deve ser igual a 1! Tente novamente!'};
    }
    // Caso não seja uma data.
    else if (isNaN(dataTerminoTeste)) {
      return { text: 'Data incorreta! Tente novamente! Exemplo: July 22 2090 15:00'};
    }
    // Caso a data de início seja mais recente que a data de término da votação.
    else if ((dataTerminoTeste - dataInicioTeste) < 0) {
      return { text: 'Data de término anterior a data de início! Tente novamente! Ex: July 22 2090 15:00'};
    }
    
    
    // Inicia strings vazias para utilização no código.
    var linkDown = '0';
    var sendEmailFlag = 'Deny';
    var emailEleitorAtual = ' ';
    var fimTempoVoto = 0;
    
    var ss = SpreadsheetApp.create(nomeEleicao); // Cria planilha.
    var sheet1 = ss.getSheets()[0];
    sheet1.setName('ResultadoFinal');
    ss.getSheetByName('ResultadoFinal').copyTo(ss);
    var linkPlanilha = ss.getUrl(); // Pega o link de edição da planilha.
    var sheet2 = SpreadsheetApp.openByUrl(linkPlanilha).getSheets()[1];
    sheet2 = sheet2.setName('DadosEnquete');
    
    var id = SpreadsheetApp.openByUrl(linkPlanilha).getId();
    var spreadsheetFile = DriveApp.getFileById(id);
    var spreadsf = spreadsheetFile.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.EDIT);
    
    linkPlanilha = enc(linkPlanilha);
    // Inicia a cédula de votação.
    return createMessage(mesario, emailEleitorAtual, '<font color=\"#0000ff\"> Votação iniciada. Comecem a votar!</font>', 
                         parametrosEleicao,linkPlanilha, mesario, mesarioEmail, dataInicio, linkDown, '0', '0', sendEmailFlag, fimTempoVoto, false)
  }
  catch(e){
    var message = e.message+'\nErro na execução do Arquivo: '+e.fileName+' on line: '+e.lineNumber;
    message = message + '\nUsuário: ' + mesarioEmail;
    message = message + '\nApp: Coltekete';
    MailApp.sendEmail('dener@teiacoltec.org', 'Alerta de Erro - Coltekete', message);
    MailApp.sendEmail('rafael@teiacoltec.org', 'Alerta de Erro - Coltekete', message);
    return {"text": "Algo deu errado na inicialização da votação! Um relatório de erros foi enviado aos desenvolvedores!"}
  }
}

//Função que cria um "interactive card" com botões contendo as opções de voto.
function createMessage(voter, emailEleitorAtual,validacaoVoto, parametrosEleicao, linkPlanilha, mesario, mesarioEmail,
                       dataInicio, linkDown, apagaCedula, apagaCedula2,
                       sendEmailFlag, fimTempoVoto, shouldUpdate) {
  
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // wait 30 seconds for others' use of the code section and lock to stop and then proceed
  } catch (e) {
  }
  
  var parEleicao = parametrosEleicao.split('>');
  var nomeEleicao = parEleicao[0];
  var numMaxEscolhas = parEleicao[1];
  var opcoes = parEleicao[2].split('$');
  var numOpcoes = opcoes.length;
  var maxOpcoes = 10;
  // Preenche as opções sobressalentes com string vazia.
  for (var i = numOpcoes+1; i <= maxOpcoes; i++) {
    opcoes.push('\f');
  }
  opcoes[10] = 'Abstenção';
  
  var dataTermino = parEleicao[3];
  
  var options = { month: 'long', day: 'numeric',hour: 'numeric',minute: 'numeric'};
  var countDownDate = new Date(dataTermino).getTime(); // Determina o horário final.
  var now = new Date().getTime();   // Pega o horário atual.
  var newNow = new Date().toLocaleString('pt-BR');   // Pega o horário atual.
  var distance = countDownDate - now;   // Encontra o período entre o prazo final e o tempo atual.
  dataTermino = new Date(dataTermino).toLocaleString('pt-BR'); // Para leitura da data no Brasil.
  
  // Parâmetros que são passados para a função onCardClick quando solicitado.
  // Aparentemente, a função onCardClick só recebe valores em formato String. Portanto, todas os parâmetros são passados dessa maneira.
  var parameters = [{key: 'parVotacao', value: parametrosEleicao.toString()},
                    {key: 'linkSheet', value: linkPlanilha.toString()},
                    {key: 'mesarioName', value: mesario.toString()},
                    {key: 'mesarioEmail', value: mesarioEmail.toString()},
                    {key: 'dataTermino', value: distance.toString()},
                    {key: 'dataInicio', value: dataInicio.toString()},
                    {key: 'erase', value: apagaCedula.toString()},
                    {key: 'email', value: emailEleitorAtual.toString()},
                    {key: 'timer', value: fimTempoVoto.toString()}];
  
  // Utilizado para limpar toda a cédula caso solicitado pelo mesário.
  if (apagaCedula == '1' && apagaCedula2 == '1') {
    return {    
      actionResponse: {
        type: 'UPDATE_MESSAGE'
    },
      text: 'Cédula Apagada.'
    }
  }
  
  var headerTitle = 'Coltekete em execução!';
  var headerSubtitle = 'Assessor de votação do COLTEC!';
  var headerImage = IMAGE_COLTEC;       
  // Caso o tipo de votação seja enquete, mostra um link de download do resultado.    
  if (linkDown != '0') {
    var textPar3 = '<b>Status:</b>' + validacaoVoto +
      '\n<b>Gestão: <font color=\"#0000ff\">' + mesarioEmail + '</font></b>' +
        '\n<b>Resultado da Enquete</b>: <a href="'+linkDown+'">' + 'Visualizar </a>';  
  }
  else {          
    var textPar3 = '<b>Status:</b>' + validacaoVoto + '</font>' +
      '\n<b>Gestão: <font color=\"#0000ff\">' + mesarioEmail + '</font></b>';
  }
  var textPar1 = '<b>Cédula: ' + '<font color=\"#006400\">' + nomeEleicao + '</font>\n' +
    'Nº Máx. de Votos: ' + '<font color=\"#006400\">' + numMaxEscolhas + '.</b><font color=\"#006400\">';
  var textPar2 = '<b><font color=\"#006400\">                    <u>OPÇÕES DE VOTO</font></b></u>';
  var textApagar = IMAGE_COLTEC;
  
  
    // Mensagem que será enviada por e-mail em caso de voto bem-sucedido retornado pela função onCardClick.
  var messageEmail = 'Voto realizado com sucesso na eleição ' +  nomeEleicao + 
    '! Obrigado!\n------------------------------------------\nMensagem auto-enviada por Coltekete!\n\nVoto realizado em ' + newNow.toString();
  
  if (sendEmailFlag == 'Allow') {
    MailApp.sendEmail(emailEleitorAtual,nomeEleicao, messageEmail, true);
  }
  
  lock.releaseLock();
  // A função retorna a cédula com as seções, botões de comando e textos.
  return {
    actionResponse: {
      type: shouldUpdate ? 'UPDATE_MESSAGE' : 'NEW_MESSAGE'
    },
    cards: [{
//  ------------- Seção 1 ------------------------------------
      header: {
        title: headerTitle,
        subtitle : headerSubtitle,
        imageUrl : headerImage,
      },
      sections: [{   
// -------------- Seção 2 ----------------------------------- 
        widgets: [{
          textParagraph: {
            text: textPar1, 
          }
        }]
      },{
// -------------- Seção 3 -----------------------------------  
          widgets: [{
            textParagraph: {
              text: textPar2,
            }
          },{
            buttons: [{
// ------------- Botão Opção 1 (Seção 3) ----------------
            textButton: {
              text: '<font color=\"#ffa500\">' + opcoes[0] + '</font>',
              onClick: {
                action: {
                  actionMethodName: 'upvote1',
                  parameters: parameters
                }
              }
            }
          },{
// ------------- Botão Opção 2 (Seção 3) ---------------
            textButton: {
              text: '<font color=\"#120a8f\">' + opcoes[1] + '</font>', 
              onClick: {
                action: {
                  actionMethodName: 'upvote2',
                  parameters: parameters
                }
              }
            }
          },{      
// ------------- Botão Opção 3 (Seção 3) ----------------                  
            textButton: {
              text: '<font color=\"#3f888f\">' + opcoes[2] + '</font>', 
              onClick: {
                action: {
                  actionMethodName: 'upvote3',
                  parameters: parameters
                }
              }
            }
          },{     
// ------------- Botão Opção 4 (Seção 3) ----------------         
            textButton: {
              text: '<font color=\"#f7a22e\">' + opcoes[3] + '</font>', 
              onClick: {
                action: {
                  actionMethodName: 'upvote4',
                  parameters: parameters
                }
              }
            }
          },{
// ------------- Botão Opção 5 (Seção 3) ----------------      
            textButton: {
              text: '<font color=\"#084d6e\">' + opcoes[4] + '</font>', 
              onClick: {
                action: {
                  actionMethodName: 'upvote5',
                  parameters: parameters
                }
              }
            }
          },{
// ------------- Botão Opção 6 (Seção 3) ----------------      
            textButton: {
              text: '<font color=\"#ffa500\">' + opcoes[5] + '</font>', 
              onClick: {
                action: {
                  actionMethodName: 'upvote6',
                  parameters: parameters
                }
              }
            }
          },{
// ------------- Botão Opção 7 (Seção 3) ----------------      
            textButton: {
              text: '<font color=\"#120a8f\">' + opcoes[6] + '</font>', 
              onClick: {
                action: {
                  actionMethodName: 'upvote7',
                  parameters: parameters
                }
              }
            }
          },{
// ------------- Botão Opção 8 (Seção 3) ----------------      
            textButton: {
              text: '<font color=\"#3f888f\">' + opcoes[7] + '</font>', 
              onClick: {
                action: {
                  actionMethodName: 'upvote8',
                  parameters: parameters
                }
              }
            }
          },{
// ------------- Botão Opção 9 (Seção 3) ----------------      
            textButton: {
              text: '<font color=\"#f7a22e\">' + opcoes[8] + '</font>', 
              onClick: {
                action: {
                  actionMethodName: 'upvote9',
                  parameters: parameters
                }
              }
            }
          },{
// ------------- Botão Opção 10 (Seção 3) ---------------      
            textButton: {
              text: '<font color=\"#084d6e\">' + opcoes[9] + '</font>', 
              onClick: {
                action: {
                  actionMethodName: 'upvote10',
                  parameters: parameters
                }
              }
            }
          }]
        }]
      },{
            widgets: [{
              buttons:[{
// ------------- Botão Voto Abstenção (Seção 4) --------------------------      
            textButton: {
              text: '<font color=\"#696969\">' + opcoes[10] + '</font>',
              onClick: {
                action: {
                  actionMethodName: 'abstenção',
                  parameters: parameters
                }
              }
            }
          },{
            
// ------------- Botão Apagar Planilha (Seção 4) ---------------------------    
            imageButton: {
              iconUrl: IMAGE_COLTEC, 
              onClick: {
                action: {
                  actionMethodName: 'erase',
                  parameters: parameters
                }
              }
            }
          }] // Fim dos botões do widget buttons da seção 4
        }] // Fim dos widgets (seção 4)
      },{   
// -------------- Seção 5 do cartão 1 --------------------------  
        widgets: [{
          textParagraph: {
            text: textPar3, 
          }
        }]
      },{
// ------------- Seção 6 do cartão 1 ---------------------------
        widgets: [{
          keyValue: {
            topLabel: 'Início: ' + dataInicio,
            content:  '<b>Término:</b>' + dataTermino,
            contentMultiline: 'true',
            icon: 'CLOCK',
            onClick:  {
              action: {
                actionMethodName: 'gerarPlanilha',
                parameters: parameters
              }
            }
          }
        }]// Fim do widget (cartão 1, seção 3)
      }] // Fim das seções (cartão 1)
    }] // Fim do cartão
  }
}

// Função chamada quando o bot é removido da sala. -----------------------------------------------------------------------------------------------

function onRemoveFromSpace(event) {
  console.info("Bot removed from ", event.space.name);
}

  