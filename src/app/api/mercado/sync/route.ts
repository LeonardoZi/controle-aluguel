import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import * as xlsx from "xlsx";
import { prisma } from "@/lib/prisma";

type LinhasSINAPI = {
  "Descrição do Insumo"?: string;
  "Código do Insumo"?: string | number;
  "Código do\r\nInsumo"?: string | number;
  Unidade?: string;
  SP?: string | number;
  [key: string]: unknown;
};

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), "data", "SINAPI.xlsx");

    const fileBuffer = fs.readFileSync(filePath);

    const read = xlsx.read(fileBuffer, { type: "buffer" });
    const ISD = read.Sheets["ISD"];

    if (!ISD) {
      return NextResponse.json(
        { error: "Aba ISD não encontrada" },
        { status: 400 },
      );
    }

    const dados = xlsx.utils.sheet_to_json(ISD);
    const palavrasChave = [
      "CABO FLEX",
      "CABO NU",
      "CABO DE COBRE",
      "FIO",
      "DISJUNTOR",
      "CONDUITE",
      "CONDUI",
      "ELETRODUTO",
      "PERFILADO",
      "ELETROCALHA",
      "CANALETA",
      "CAIXA PVC",
      "CAIXA DE PASSAGEM",
      "QUADRO DE DISTRIBUICAO",
      "ABRACADEIRA DE NYLON",
      "BARRAMENTO",
      "PLACA 4X2",
      "TOMADA",
      "INTERRUPTOR",
      "BOCAL",
      "PLAFON",
      "CONECTOR",
      "CONECTOR PORCELANA",
      "PLUG",
      "PLUG MACHO",
      "PLUG FEMEA",
      "PLUG STECK",
      "LAMPADA",
      "PROJETOR DE LED",
      "FITA DE LED",
      "CHUVEIRO",
      "DRIVE",
      "TRANSFORMADOR",
      "CAMERA",
      "ANTENA",
      "ROTEADOR",
      "PORTEIRO ELETRONICO",
      "MACARICO",
      "CHAVE DE FENDA",
      "FURADEIRA",
      "ALICATE",
      "MULTIMETRO",
      "VEDA ROSCA",
      "FITA VEDA ROSCA",
      "SILICONE",
      "LANTERNA",
      "FITA ISOLANTE",
      "CONTATOR",
      "RELE",
      "SENSOR DE PRESENCA",
      "HASTE DE ATERRAMENTO",
      "TERMINAL",
      "LUMINARIA",
      "REATOR",
      "CURVA PVC",
      "LUVA PVC",
    ];
    const materiaisEletricos = [];

    for (const linha of dados as LinhasSINAPI[]) {
      const nome = linha["Descrição do Insumo"] || "";

      const descricaoLimpa = nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
      const ehMaterialEletrico = palavrasChave.some((palavra) =>
        descricaoLimpa.includes(palavra),
      );

      if (ehMaterialEletrico) {
        const codigo =
          linha["Código do\r\nInsumo"] || linha["Código do Insumo"];
        const preco = linha["SP"];

        if (codigo && preco) {
          const precoNum =
            typeof preco === "number"
              ? preco
              : parseFloat(String(preco).replace(",", "."));

          if (!isNaN(precoNum)) {
            materiaisEletricos.push({
              codigoSinapi: String(codigo),
              nome: nome,
              unidade: String(linha["Unidade"] || "UN"),
              precoUnitario: precoNum,
            });
          }
        }
      }
    }

    await prisma.$transaction([
      prisma.precoMercado.deleteMany({}),
      prisma.precoMercado.createMany({
        data: materiaisEletricos,
      }),
    ]);

    return NextResponse.json({
      sucesso: true,
      totalLinhas: dados.length,
      totalFiltrados: materiaisEletricos.length,
      mensagem: "Dados salvos no banco de dados com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao ler o arquivo", error);
    return NextResponse.json(
      { error: "Erro ao processar o arquivo." },
      { status: 500 },
    );
  }
}
