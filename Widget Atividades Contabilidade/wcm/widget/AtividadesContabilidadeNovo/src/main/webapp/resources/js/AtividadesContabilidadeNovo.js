var AtividadesContabilidadeNovo = SuperWidget.extend({
    //método iniciado quando a widget é carregada
    init: function () {
        intervalAutoRefresh = null;
        LoadingCarregandoRelatorio = FLUIGC.loading('#divListaAtividades');
        
        montaListaDeAnosNoFiltro();
        setMesEAnoParaAtual();

        ExecutaRelatorio();
        setIntevaloDeExecucaoDoRelatorio(intervalAutoRefresh);
        $("#panelFiltros .panel-body").hide();
        $("#TodasAtividades").hide();

        $("#autoRefresh").on("change", function () {
            setIntevaloDeExecucaoDoRelatorio(intervalAutoRefresh);
        });
        $("#panelFiltros .panel-heading").on("click", function () {
            $("#panelFiltros .panel-body").slideToggle();
        });
        $("#Relatorio, #MesFiltro, #AnoFiltro").on("change", function () {
            ExecutaRelatorio();
        });
        $("#btnExportarDados").on("click", function () {
            ExportarDados();
        });
    }
});

function montaListaDeAnosNoFiltro(){
    const anoAtual = new Date().getFullYear();
    const menorAno = 2018;
    var html = "";

    for (let ano = anoAtual; ano >= menorAno; ano--) {
        html+=`<option value="${ano}">${ano}</option>`;
    }

    $("#AnoFiltro").html(html);
}

function setIntevaloDeExecucaoDoRelatorio(intervalAutoRefresh) {
    clearInterval(intervalAutoRefresh);

    if ($("#autoRefresh").val() != "Desativado") {
        intervalAutoRefresh = setInterval(() => {
            ExecutaRelatorio();
        }, $("#autoRefresh").val() * 60 * 1000);
    }
}

async function ExecutaRelatorio() {
    LoadingCarregandoRelatorio.show();

    var relatorio = $("#Relatorio").val();
    $("#TodasAtividades, #ChamadosPorSolucao, #ChamadosPorSolicitante, #DivergenciasPorUsuario, #FundoFixoAprovadoPorUsuario").hide();

    if (relatorio == "Todas as Atividades") {
        await CriaListaAtividadeContab();
        $("#TodasAtividades").show();
    }
    else if(relatorio == "Chamados por Solução"){
        await CriaListaChamadosPorSolucao();
        $("#ChamadosPorSolucao").show();
    }
    else if(relatorio == "Chamados por Solicitante"){
        await CriaListaChamadosPorSolicitante();
        $("#ChamadosPorSolicitante").show();
    }
    else if(relatorio == "Divergências Lançadas por Usuário"){
        await CriaListaDivergenciasPorUsuario();
        $("#DivergenciasPorUsuario").show();
    }
    else if(relatorio == "Fundo Fixo Aprovado Por Usuário"){
        await CriaListaFundoFixoAprovadoPorUsuario();
        $("#FundoFixoAprovadoPorUsuario").show();
    }


    LoadingCarregandoRelatorio.hide();
}

async function CriaListaAtividadeContab() {
    var [ListaDeAtividades, Divergencias, FundoFixo] = await BuscaListagemDasAtividadesDaContabilidade();
    var MostraHoje = ValidaSeMesEAnoSaoOsAtuais();
    var stringHTML = '';

    for (const list of ListaDeAtividades) {
        stringHTML+="<tr>";

        stringHTML+="<td>";
        stringHTML+=list.categoria;
        stringHTML+="</td>";

        stringHTML+="<td>";
        stringHTML+=list.QNTD;
        stringHTML+="</td>";


        if (MostraHoje) {
            $(".ThHoje").show();
            stringHTML+="<td>";
            stringHTML+=list.QNTDHOJE;
            stringHTML+="</td>";
        }else{
            $(".ThHoje").hide();
        }

        stringHTML+="</tr>";
    }

    for (const list of Divergencias) {
        stringHTML+="<tr>";

        stringHTML+="<td>";
        stringHTML+="Divergências Lançadas";
        stringHTML+="</td>";

        stringHTML+="<td>";
        stringHTML+=list.QNTD;
        stringHTML+="</td>";

        if (MostraHoje) {
            $(".ThHoje").show();
            stringHTML+="<td>";
            stringHTML+=list.Hoje;
            stringHTML+="</td>";
        }

        stringHTML+="<tr>";
    }

    for (const list of FundoFixo) {
        stringHTML+="<tr>";

        stringHTML+="<td>";
        stringHTML+="Fundo Fixo/RDO Aprovado";
        stringHTML+="</td>";

        stringHTML+="<td>";
        stringHTML+=list.QNTD;
        stringHTML+="</td>";

        if (MostraHoje) {
            $(".ThHoje").show();
            stringHTML+="<td>";
            stringHTML+=list.QNTDHOJE;
            stringHTML+="</td>";
        }

        stringHTML+="<tr>";
    }


    $("#tbodyTodasAtividades").html(stringHTML);

    async function BuscaListagemDasAtividadesDaContabilidade() {
        var mes = $("#MesFiltro").val();
        var ano = $("#AnoFiltro").val();
        var dia = new Date().getDate().toString().padStart(2, "0");;

        var ds = await ExecutaDataset("ListaAtividadesDaContabilidadeNoFluig", null, [
            DatasetFactory.createConstraint("Operacao", "ChamadosResolvidosPorCategoria", "ChamadosResolvidosPorCategoria", ConstraintType.MUST),
            DatasetFactory.createConstraint("Mes", mes, mes, ConstraintType.MUST),
            DatasetFactory.createConstraint("Ano", ano, ano, ConstraintType.MUST),
            DatasetFactory.createConstraint("Dia", dia, dia, ConstraintType.MUST)
        ], null);

        var ds2 =  await ExecutaDataset("ListaAtividadesDaContabilidadeNoFluig", null, [
            DatasetFactory.createConstraint("Operacao", "DivergenciasLancadas", "DivergenciasLancadas", ConstraintType.MUST),
            DatasetFactory.createConstraint("Mes", mes, mes, ConstraintType.MUST),
            DatasetFactory.createConstraint("Ano", ano, ano, ConstraintType.MUST),
            DatasetFactory.createConstraint("Dia", dia, dia, ConstraintType.MUST)
        ], null);

        var ds3 =  await ExecutaDataset("ListaAtividadesDaContabilidadeNoFluig", null, [
            DatasetFactory.createConstraint("Operacao", "FundoFixoAprovado", "FundoFixoAprovado", ConstraintType.MUST),
            DatasetFactory.createConstraint("Mes", mes, mes, ConstraintType.MUST),
            DatasetFactory.createConstraint("Ano", ano, ano, ConstraintType.MUST),
            DatasetFactory.createConstraint("Dia", dia, dia, ConstraintType.MUST)
        ], null);

        return [ds,ds2,ds3]

    }
}

async function CriaListaChamadosPorSolucao() {
    var ListaDeAtividades = await BuscaListagemDasAtividadesDaContabilidade();
    var MostraHoje = ValidaSeMesEAnoSaoOsAtuais();
    var stringHTML = '';

    for (const list of ListaDeAtividades) {
        stringHTML+="<tr>";

        stringHTML+="<td>";
        stringHTML+=list.USUARIO;
        stringHTML+="</td>";

        stringHTML+="<td>";
        stringHTML+=list.categoria;
        stringHTML+="</td>";

        stringHTML+="<td>";
        stringHTML+=list.QNTD;
        stringHTML+="</td>";


        if (MostraHoje) {
            $(".ThHoje").show();
            stringHTML+="<td>";
            stringHTML+=list.QNTDHOJE;
            stringHTML+="</td>";
        }else{
            $(".ThHoje").hide();
        }

        stringHTML+="</tr>";
    }

    $("#tbodyChamadosPorSolucao").html(stringHTML);

    async function BuscaListagemDasAtividadesDaContabilidade() {
        var mes = $("#MesFiltro").val();
        var ano = $("#AnoFiltro").val();
        var dia = new Date().getDate().toString().padStart(2, "0");;

        return await ExecutaDataset("ListaAtividadesDaContabilidadeNoFluig", null, [
            DatasetFactory.createConstraint("Operacao", "ChamadosResolvidosPorSolucao", "ChamadosResolvidosPorSolucao", ConstraintType.MUST),
            DatasetFactory.createConstraint("Mes", mes, mes, ConstraintType.MUST),
            DatasetFactory.createConstraint("Ano", ano, ano, ConstraintType.MUST),
            DatasetFactory.createConstraint("Dia", dia, dia, ConstraintType.MUST)
        ], null);
    }
}

async function CriaListaChamadosPorSolicitante() {
    var ListaDeAtividades = await BuscaListagemDasAtividadesDaContabilidade();
    var MostraHoje = ValidaSeMesEAnoSaoOsAtuais();
    var stringHTML = '';

    for (const list of ListaDeAtividades) {
        stringHTML+="<tr>";

        stringHTML+="<td>";
        stringHTML+=list.SOLICITANTE;
        stringHTML+="</td>";

        stringHTML+="<td>";
        stringHTML+=list.QNTD;
        stringHTML+="</td>";


        if (MostraHoje) {
            $(".ThHoje").show();
            stringHTML+="<td>";
            stringHTML+=list.QNTDHOJE;
            stringHTML+="</td>";
        }else{
            $(".ThHoje").hide();
        }

        stringHTML+="</tr>";
    }

    $("#tbodyChamadosPorSolicitante").html(stringHTML);

    async function BuscaListagemDasAtividadesDaContabilidade() {
        var mes = $("#MesFiltro").val();
        var ano = $("#AnoFiltro").val();
        var dia = new Date().getDate().toString().padStart(2, "0");

        return await ExecutaDataset("ListaAtividadesDaContabilidadeNoFluig", null, [
            DatasetFactory.createConstraint("Operacao", "ChamadosPorSolicitante", "ChamadosPorSolicitante", ConstraintType.MUST),
            DatasetFactory.createConstraint("Mes", mes, mes, ConstraintType.MUST),
            DatasetFactory.createConstraint("Ano", ano, ano, ConstraintType.MUST),
            DatasetFactory.createConstraint("Dia", dia, dia, ConstraintType.MUST)
        ], null);
    }
}

async function CriaListaDivergenciasPorUsuario() {
    var ListaDeAtividades = await BuscaListagemDasDivergenciasPorUsuario();
    var MostraHoje = ValidaSeMesEAnoSaoOsAtuais();
    var stringHTML = '';

    for (const list of ListaDeAtividades) {
        stringHTML+="<tr>";

        stringHTML+="<td>";
        stringHTML+=list.USUARIO;
        stringHTML+="</td>";

        stringHTML+="<td>";
        stringHTML+=list.QNTD;
        stringHTML+="</td>";


        if (MostraHoje) {
            $(".ThHoje").show();
            stringHTML+="<td>";
            stringHTML+=list.QNTDHOJE;
            stringHTML+="</td>";
        }else{
            $(".ThHoje").hide();
        }

        stringHTML+="</tr>";
    }

    $("#tbodyDivergenciasPorUsuario").html(stringHTML);

    async function BuscaListagemDasDivergenciasPorUsuario() {
        var mes = $("#MesFiltro").val();
        var ano = $("#AnoFiltro").val();
        var dia = new Date().getDate().toString().padStart(2, "0");

        return await ExecutaDataset("ListaAtividadesDaContabilidadeNoFluig", null, [
            DatasetFactory.createConstraint("Operacao", "DivergenciasLancadasPorUsuario", "DivergenciasLancadasPorUsuario", ConstraintType.MUST),
            DatasetFactory.createConstraint("Mes", mes, mes, ConstraintType.MUST),
            DatasetFactory.createConstraint("Ano", ano, ano, ConstraintType.MUST),
            DatasetFactory.createConstraint("Dia", dia, dia, ConstraintType.MUST)
        ], null);
    }
}

async function CriaListaFundoFixoAprovadoPorUsuario() {
    var ListaDeAtividades = await BuscaListagemDasDivergenciasPorUsuario();
    var MostraHoje = ValidaSeMesEAnoSaoOsAtuais();
    var stringHTML = '';

    for (const list of ListaDeAtividades) {
        stringHTML+="<tr>";

        stringHTML+="<td>";
        stringHTML+=list.USUARIO;
        stringHTML+="</td>";

        stringHTML+="<td>";
        stringHTML+=list.QNTD;
        stringHTML+="</td>";


        if (MostraHoje) {
            $(".ThHoje").show();
            stringHTML+="<td>";
            stringHTML+=list.QNTDHOJE;
            stringHTML+="</td>";
        }else{
            $(".ThHoje").hide();
        }

        stringHTML+="</tr>";
    }

    $("#tbodyFundoFixoAprovadoProUsuario").html(stringHTML);

    async function BuscaListagemDasDivergenciasPorUsuario() {
        var mes = $("#MesFiltro").val();
        var ano = $("#AnoFiltro").val();
        var dia = new Date().getDate().toString().padStart(2, "0");;

        return await ExecutaDataset("ListaAtividadesDaContabilidadeNoFluig", null, [
            DatasetFactory.createConstraint("Operacao", "FundoFixoAprovadoPorUsuario", "FundoFixoAprovadoPorUsuario", ConstraintType.MUST),
            DatasetFactory.createConstraint("Mes", mes, mes, ConstraintType.MUST),
            DatasetFactory.createConstraint("Ano", ano, ano, ConstraintType.MUST),
            DatasetFactory.createConstraint("Dia", dia, dia, ConstraintType.MUST)
        ], null);
    }
}



function setMesEAnoParaAtual() {
    var dateNow = new Date();
    $("#MesFiltro").val(dateNow.getMonth() + 1);
    $("#AnoFiltro").val(dateNow.getFullYear());

}

function ExportarDados() {
    var relatorio = $("#Relatorio").val();

    if (relatorio == "Todas as Atividades") {
        exportTableToCsv("AtividadesControl", "AtividadesControl");
    }
    else if (relatorio == "Inserção de Medições") {
        exportTableToCsv("MedicoesInseridas", "MedicoesInseridas");
    }
    else if (relatorio == "Aprovação de Medição") {
        exportTableToCsv("MedicoesAprovadas", "MedicoesAprovadas");
    }
    else if (relatorio == "Aprovação de Parcelas(1.1.98)") {
        exportTableToCsv("ParcelasAprovadas", "ParcelasAprovadas");
    }
    else if (relatorio == "Contratos, Aditivos e Rescisões") {
        exportTableToCsv("ContratosAditivosRescisoes", "ContratosAditivosRescisoes");
    }
    else if (relatorio == "Envio das Medições") {
        exportTableToCsv("EnviodasMedições", "EnvioDasMedicoes");
    }


    function exportTableToCsv(filename, target) {
        var csv = [];
        var rows = document.querySelectorAll("#" + target + " tr");

        for (var i = 0; i < rows.length; i++) {
            var row = [], cols = rows[i].querySelectorAll("td, th");

            for (var j = 0; j < cols.length; j++) {
                row.push(cols[j].innerText);
            }

            csv.push(row.join(";"));
        }

        // Cria um elemento <a> invisível
        var link = document.createElement("a");
        link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv.join("\n")));
        link.setAttribute("download", filename);

        // Simula o clique no link para iniciar o download
        link.click();
    }
}

function ExecutaDataset(DatasetName, Fields, Constraints, Order) {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset(DatasetName, Fields, Constraints, Order, {
            success: (ds => {
                console.log(ds)
                if (!ds || !ds.values || ds.values.length == 0 || ds.values[0][0] == "deu erro! ") {
                    $("#MedicoesInseridas, #MedicoesAprovadas, #ParcelasAprovadas, #ContratosAditivosRescisoes").hide();

                    console.error("Erro ao executar o Dataset: " + DatasetName);
                    console.error(ds);
                    FLUIGC.toast({
                        title: "Erro ao executar o Dataset: " + DatasetName,
                        message: "",
                        type: "warning"
                    });
                    reject();
                }
                else {
                    resolve(ds.values);
                }
            }),
            error: (e => {
                console.error("Erro ao executar o Dataset: " + DatasetName);
                console.error(e);
                FLUIGC.toast({
                    title: "Erro ao executar o Dataset: " + DatasetName,
                    message: "",
                    type: "warning"
                });
                reject();
            })
        })
    });
}

function ValidaSeMesEAnoSaoOsAtuais() {
    var Mes = $("#MesFiltro").val();
    var Ano = $("#AnoFiltro").val();
    var dateNow = new Date();

    if (parseInt(Mes) == (dateNow.getMonth() + 1) && parseInt(Ano) == dateNow.getFullYear()) {
        return true;
    }
    return false;
}