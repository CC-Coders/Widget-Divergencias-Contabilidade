function defineStructure() {

}

function onSync(lastSyncDate) {

}

function createDataset(fields, constraints, sortFields) {
    try {
        if (constraints) {
            var [Operacao, Ano, Mes, Dia] = ExtraiConstraints(constraints);
            var myQuery = null;

            if (Operacao == "ChamadosResolvidosPorCategoria") {
                myQuery = MontaQueryChamadosResolvidosPorCategoria(Ano, Mes, Dia);
            }
            else if (Operacao == "ChamadosResolvidosPorSolucao") {
                myQuery = MontaQueryChamadosResolvidosPorSolucao(Ano, Mes, Dia);
            }
            else if (Operacao == "ChamadosPorSolicitante") {
                myQuery = MontaQueryChamadosPorSolicitante(Ano, Mes, Dia);
            }
            else if(Operacao == "DivergenciasLancadas"){
                myQuery = MontaQueryDivergenciasLancadasPorMes(Ano, Mes, Dia);
            }
            else if(Operacao == "DivergenciasLancadasPorUsuario"){
                myQuery = MontaQueryDivergenciasLancadasPorUsuario(Ano, Mes, Dia);
            }
            else if(Operacao == "FundoFixoAprovado"){
                myQuery = MontaQueryFundoFixoAprovado(Ano, Mes, Dia);
            }
            else if(Operacao == "FundoFixoAprovadoPorUsuario"){
                myQuery = MontaQueryFundoFixoAprovadoPorUsuario(Ano, Mes, Dia);
            }

            log.info("ListaAtividadesDaContabilidade: " + myQuery);

            if (Operacao == "DivergenciasLancadas" || Operacao == "DivergenciasLancadasPorUsuario") {
                return executaQueryNoCastilhoCustom(myQuery);

            }else{

                return executaQueryNoFluig(myQuery);
            }

        }
    } catch (error) {
        log.info("Erro ao executar ListaAtividadesDaControladoria: " + error);
        var newDataset = DatasetBuilder.newDataset();
        newDataset.addColumn("coluna");
        newDataset.addRow(["deu erro! "]);
        newDataset.addRow([error]);
    }
}

function onMobileSync(user) {

}

function ExtraiConstraints(constraints) {
    var Operacao = null;
    var Mes = null;
    var Ano = null;
    var Dia = null;

    for (i = 0; i < constraints.length; i++) {
        if (constraints[i].fieldName == "Operacao") {
            Operacao = constraints[i].initialValue;

        } else if (constraints[i].fieldName == "Ano") {
            Ano = constraints[i].initialValue;
        }
        else if (constraints[i].fieldName == "Mes") {
            Mes = constraints[i].initialValue;
        }
        else if (constraints[i].fieldName == "Dia") {
            Dia = constraints[i].initialValue;
        }
    }

    if (Operacao && Mes) {
        return [Operacao, Ano, Mes, Dia];
    }
    else {
        throw "Constraints não informadas.";
    }
}

function MontaQueryChamadosResolvidosPorCategoria(Ano, Mes, Dia) {
    if (Mes < 10 ) {
        var DataInicio = Ano + "-0" + Mes;
    }
    else{
        var DataInicio = Ano + "-" + Mes;
    }


    var DataFim = null;
    if (Mes == 12) {
        DataFim = (parseInt(Ano) + 1) + "-01";
    }
    else {
        Mes = parseInt(Mes) + 1;
        if (Mes < 10 ) {
            Mes = "0" + Mes
        }
        DataFim = Ano + "-" +Mes;
    }


    var myQuery =
        "SELECT\
            COUNT(PROCES_WORKFLOW.NUM_PROCES) as QNTD,\
            COUNT(CASE WHEN PROCES_WORKFLOW.END_DATE like '" + DataInicio + "-" + Dia + "%' THEN 1 END) as 'QNTDHOJE',\
            ML00135283.categoria\
        FROM PROCES_WORKFLOW\
            INNER JOIN ML00135283 ON ML00135283.documentid = PROCES_WORKFLOW.NR_DOCUMENTO_CARD\
            INNER JOIN TAR_PROCES ON PROCES_WORKFLOW.NUM_PROCES = TAR_PROCES.NUM_PROCES AND TAR_PROCES.IDI_STATUS = 2 AND TAR_PROCES.NUM_SEQ_ESCOLHID = 6\
        WHERE\
            PROCES_WORKFLOW.END_DATE >= '" + DataInicio + "-01'\
            AND PROCES_WORKFLOW.END_DATE < '" + DataFim + "-01'\
            AND  ML00135283.atendimento != ''\
        GROUP BY ML00135283.categoria\
        ORDER BY QNTD DESC";

    return myQuery;
}

function MontaQueryChamadosResolvidosPorSolucao(Ano, Mes, Dia) {
    if (Mes < 10 ) {
        var DataInicio = Ano + "-0" + Mes;
    }
    else{
        var DataInicio = Ano + "-" + Mes;
    }


    var DataFim = null;
    if (Mes == 12) {
        DataFim = (parseInt(Ano) + 1) + "-01";
    }
    else {
        Mes = parseInt(Mes) + 1;
        if (Mes < 10 ) {
            Mes = "0" + Mes
        }
        DataFim = Ano + "-" +Mes;
    }


    var myQuery =
        "SELECT\
            COUNT(PROCES_WORKFLOW.NUM_PROCES) as QNTD,\
            COUNT(CASE WHEN PROCES_WORKFLOW.END_DATE like '" + DataInicio + "-" + Dia + "%' THEN 1 END) as 'QNTDHOJE',\
            ML00135283.atendimento as USUARIO,\
            ML00135283.categoria\
        FROM PROCES_WORKFLOW\
            INNER JOIN ML00135283 ON ML00135283.documentid = PROCES_WORKFLOW.NR_DOCUMENTO_CARD AND ML00135283.atividade = 5 AND ML00135283.decisao = 'Enviar' AND ML00135283.tempo_gasto != '' AND ML00135283.tempo_gasto != '00:00:00'\
        WHERE\
            PROCES_WORKFLOW.END_DATE >= '" + DataInicio + "-01'\
            AND PROCES_WORKFLOW.END_DATE < '" + DataFim + "-01'\
            AND  ML00135283.atendimento != ''\
        GROUP BY atendimento, ML00135283.categoria\
        ORDER BY USUARIO, QNTD DESC";

    return myQuery;
}

function MontaQueryChamadosPorSolicitante(Ano, Mes, Dia) {
    if (Mes < 10 ) {
        var DataInicio = Ano + "-0" + Mes;
    }
    else{
        var DataInicio = Ano + "-" + Mes;
    }


    var DataFim = null;
    if (Mes == 12) {
        DataFim = (parseInt(Ano) + 1) + "-01";
    }
    else {
        Mes = parseInt(Mes) + 1;
        if (Mes < 10 ) {
            Mes = "0" + Mes
        }
        DataFim = Ano + "-" +Mes;
    }
    var myQuery =
        "SELECT\
            COUNT(NUM_PROCES) as QNTD,\
            COUNT(CASE WHEN PROCES_WORKFLOW.END_DATE like '" + DataInicio + "-" + Dia + "%' THEN 1 END) as 'QNTDHOJE',\
            COD_MATR_REQUISIT as SOLICITANTE\
        FROM PROCES_WORKFLOW\
            INNER JOIN ML00135283 ON ML00135283.documentid = PROCES_WORKFLOW.NR_DOCUMENTO_CARD AND ML00135283.atividade = 5 AND ML00135283.decisao = 'Enviar' AND ML00135283.tempo_gasto != '' AND ML00135283.tempo_gasto != '00:00:00'\
        WHERE\
            COD_DEF_PROCES = 'Suporte Contabilidade'\
            AND PROCES_WORKFLOW.END_DATE >= '" + DataInicio + "-01'\
            AND PROCES_WORKFLOW.END_DATE < '" + DataFim + "-01'\
        GROUP BY COD_MATR_REQUISIT\
        ORDER BY COUNT(NUM_PROCES) DESC";

    return myQuery;
}

function MontaQueryDivergenciasLancadasPorMes(Ano, Mes, Dia){
    if (Mes < 10 ) {
        var DataInicio = Ano + "-0" + Mes;
    }
    else{
        var DataInicio = Ano + "-" + Mes;
    }


    var DataFim = null;
    if (Mes == 12) {
        DataFim = (parseInt(Ano) + 1) + "-01";
    }
    else {
        Mes = parseInt(Mes) + 1;
        if (Mes < 10 ) {
            Mes = "0" + Mes
        }
        DataFim = Ano + "-" +Mes;
    }




    var myQuery = 
    "SELECT COUNT(ID) as QNTD,\
    COUNT(CASE WHEN CREATEDON = '" + DataInicio + "-" + Dia + "' THEN 1 END) as Hoje\
    FROM DIVERGENCIASCONTABILIDADE\
    WHERE CREATEDON >= '" + DataInicio + "-01" + "' AND CREATEDON < '" + DataFim + "-01'";


    return myQuery;
}

function MontaQueryDivergenciasLancadasPorUsuario(Ano, Mes, Dia){
    if (Mes < 10 ) {
        var DataInicio = Ano + "-0" + Mes;
    }
    else{
        var DataInicio = Ano + "-" + Mes;
    }


    var DataFim = null;
    if (Mes == 12) {
        DataFim = (parseInt(Ano) + 1) + "-01";
    }
    else {
        Mes = parseInt(Mes) + 1;
        if (Mes < 10 ) {
            Mes = "0" + Mes
        }
        DataFim = Ano + "-" +Mes;
    }


    var myQuery = 
    "SELECT\
	    COUNT(ID) as QNTD,\
	    COUNT(CASE WHEN CREATEDON = '" + DataInicio + "-" + Dia + "' THEN 1 END ) as QNTDHOJE,\
	    CREATEDBY as USUARIO\
    FROM DIVERGENCIASCONTABILIDADE\
    WHERE\
	    CREATEDON >= '" + DataInicio + "-01'\
	    AND CREATEDON < '" + DataFim + "-01'\
    GROUP BY CREATEDBY\
    ORDER BY QNTD DESC";

    return myQuery;

}

function MontaQueryFundoFixoAprovado(Ano, Mes, Dia){
    if (Mes < 10 ) {
        var DataInicio = Ano + "-0" + Mes;
    }
    else{
        var DataInicio = Ano + "-" + Mes;
    }


    var DataFim = null;
    if (Mes == 12) {
        DataFim = (parseInt(Ano) + 1) + "-01";
    }
    else {
        Mes = parseInt(Mes) + 1;
        if (Mes < 10 ) {
            Mes = "0" + Mes
        }
        DataFim = Ano + "-" +Mes;
    }

    var myQuery =
    "SELECT\
        COUNT(PROCES_WORKFLOW.NUM_PROCES) as QNTD,\
        COUNT(CASE WHEN PROCES_WORKFLOW.END_DATE like '" + DataInicio + "-" + Dia + "%' THEN 1 END) as 'QNTDHOJE'\
    FROM PROCES_WORKFLOW\
        INNER JOIN  ML00139928 ON  ML00139928.numProces = PROCES_WORKFLOW.NUM_PROCES\
    WHERE\
        PROCES_WORKFLOW.END_DATE >= '" + DataInicio + "-01'\
        AND PROCES_WORKFLOW.END_DATE < '" + DataFim + "-01'\
        AND ML00139928.atividade = 5\
        AND ML00139928.aprov = 'sim'";


    return myQuery;
}

function MontaQueryFundoFixoAprovadoPorUsuario(Ano, Mes, Dia){
    if (Mes < 10 ) {
        var DataInicio = Ano + "-0" + Mes;
    }
    else{
        var DataInicio = Ano + "-" + Mes;
    }


    var DataFim = null;
    if (Mes == 12) {
        DataFim = (parseInt(Ano) + 1) + "-01";
    }
    else {
        Mes = parseInt(Mes) + 1;
        if (Mes < 10 ) {
            Mes = "0" + Mes
        }
        DataFim = Ano + "-" +Mes;
    }

    var myQuery =
    "SELECT\
        COUNT(PROCES_WORKFLOW.NUM_PROCES) as QNTD,\
        COUNT(CASE WHEN PROCES_WORKFLOW.END_DATE like '" + DataInicio + "-" + Dia + "%' THEN 1 END) as 'QNTDHOJE',\
        ML00139928.usuario as USUARIO\
    FROM PROCES_WORKFLOW\
        INNER JOIN  ML00139928 ON  ML00139928.numProces = PROCES_WORKFLOW.NUM_PROCES\
    WHERE\
        PROCES_WORKFLOW.END_DATE >= '" + DataInicio + "-01'\
        AND PROCES_WORKFLOW.END_DATE < '" + DataFim + "-01'\
        AND ML00139928.atividade = 5\
        AND ML00139928.aprov = 'sim'\
    GROUP BY USUARIO\
    ORDER BY USUARIO, QNTD DESC";


    return myQuery;

}


function executaQueryNoFluig(query) {
    var newDataset = DatasetBuilder.newDataset();
    var dataSource = "/jdbc/FluigDSRO";
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;

    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(query);
        var columnCount = rs.getMetaData().getColumnCount();

        while (rs.next()) {
            if (!created) {
                for (var i = 1; i <= columnCount; i++) {
                    newDataset.addColumn(rs.getMetaData().getColumnName(i));
                }
                created = true;
            }
            var Arr = new Array();
            for (var i = 1; i <= columnCount; i++) {
                var obj = rs.getObject(rs.getMetaData().getColumnName(i));
                if (null != obj) {
                    Arr[i - 1] = rs.getObject(rs.getMetaData().getColumnName(i)).toString();
                } else {
                    Arr[i - 1] = "   -   ";
                }
            }

            newDataset.addRow(Arr);
        }
    } catch (e) {
        log.error("ERRO==============> " + e.message);
        newDataset.addColumn("coluna");
        newDataset.addRow(["deu erro! "]);
        newDataset.addRow([e.message]);
        newDataset.addRow([query]);

    } finally {
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }

    return newDataset;
}
function executaQueryNoCastilhoCustom(query) {
    var newDataset = DatasetBuilder.newDataset();
    var dataSource = "/jdbc/CastilhoCustom";
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;

    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(query);
        var columnCount = rs.getMetaData().getColumnCount();

        while (rs.next()) {
            if (!created) {
                for (var i = 1; i <= columnCount; i++) {
                    newDataset.addColumn(rs.getMetaData().getColumnName(i));
                }
                created = true;
            }
            var Arr = new Array();
            for (var i = 1; i <= columnCount; i++) {
                var obj = rs.getObject(rs.getMetaData().getColumnName(i));
                if (null != obj) {
                    Arr[i - 1] = rs.getObject(rs.getMetaData().getColumnName(i)).toString();
                } else {
                    Arr[i - 1] = "   -   ";
                }
            }

            newDataset.addRow(Arr);
        }
    } catch (e) {
        log.error("ERRO==============> " + e.message);
        newDataset.addColumn("coluna");
        newDataset.addRow(["deu erro! "]);
        newDataset.addRow([e.message]);
        newDataset.addRow([query]);

    } finally {
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }

    return newDataset;
}