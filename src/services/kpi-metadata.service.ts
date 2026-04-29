import { SupportedKpiKey } from '../types'

export type KpiMetadata = {
    definition: string
    calculationExample: string[]
}

const EMPTY_KPI_METADATA: KpiMetadata = {
    definition: '',
    calculationExample: [],
}

export const KPI_METADATA: Partial<Record<SupportedKpiKey, KpiMetadata>> = {
    revenue: {
        definition: 'Den samlede indkomst, virksomheden har genereret fra salg af varer og tjenester i perioden. Beregnes som summen af alle transaktioner med kategoritype "Indtægt".',
        calculationExample: [
            'Faktura til kunde A: 80.000 kr',
            'Faktura til kunde B: 45.000 kr',
            'Abonnementsindtægt: 25.000 kr',
            'Omsætning i alt: 80.000 + 45.000 + 25.000 = 150.000 kr',
        ],
    },
    ebitda: {
        definition: 'Driftsresultat før renter, skat, afskrivninger og amortisering (Earnings Before Interest, Taxes, Depreciation and Amortization). Viser virksomhedens operative lønnsomhed renset for finansiering og regnskabsmæssige poster. Formel: EBITDA = Omsætning − Driftsomkostninger',
        calculationExample: [
            'Omsætning: 150.000 kr',
            'Lønninger: −50.000 kr',
            'Husleje: −20.000 kr',
            'Øvrige driftsomkostninger: −18.000 kr',
            'EBITDA = 150.000 − 50.000 − 20.000 − 18.000 = 62.000 kr',
        ],
    },
    netResult: {
        definition: 'Årets endelige resultat efter alle omkostninger, afskrivninger og skat. Det beløb, der reelt er tjent eller tabt i perioden. Formel: Nettoresultat = EBITDA − Afskrivninger − Skat',
        calculationExample: [
            'EBITDA: 62.000 kr',
            'Afskrivninger: −8.000 kr',
            'Skat: −12.000 kr',
            'Nettoresultat = 62.000 − 8.000 − 12.000 = 42.000 kr',
        ],
    },
    cashFlow: {
        definition: 'Pengestrøm fra driften beregnet ved den indirekte metode. Afskrivninger er ikke-kontante poster og lægges tilbage til nettoresultatet, fordi de ikke medfører en faktisk pengeudgang. Formel: Cash Flow = Nettoresultat + Afskrivninger',
        calculationExample: [
            'Nettoresultat: 42.000 kr',
            'Afskrivninger tilbageføres (ikke-kontant): +8.000 kr',
            'Cash Flow = 42.000 + 8.000 = 50.000 kr',
        ],
    },
    burnRate: {
        definition: 'Det månedliggjorte forbrug af likvide midler — dvs. hvad virksomheden bruger i kontante udbetalinger per måned. Bruges til at vurdere, hvor lang tid virksomheden kan overleve på eksisterende likviditet. Formel: Burn Rate = (Driftsomkostninger + Skat) / Antal dage × 30,44',
        calculationExample: [
            'Driftsomkostninger i perioden (31 dage): −68.000 kr',
            'Skat i perioden: −12.000 kr',
            'Samlede kontante udbetalinger: 80.000 kr',
            'Burn Rate = (80.000 / 31) × 30,44 ≈ 78.555 kr/måned',
        ],
    },
    monthlyGrowthRate: {
        definition: 'Procentvis ændring i omsætning sammenlignet med den foregående periode af samme længde. Positiv vækst indikerer fremgang, negativ vækst indikerer tilbagegang. Formel: Vækst = (Nuværende − Foregående) / Foregående × 100',
        calculationExample: [
            'Foregående periode (januar): 130.000 kr',
            'Nuværende periode (februar): 150.000 kr',
            'Vækst = (150.000 − 130.000) / 130.000 × 100 = +15,4%',
        ],
    },
    grossProfit: {
        definition: 'Omsætning minus direkte vareomkostninger (vareforbrug/COGS). Viser fortjenesten på selve produktet eller ydelsen, inden driftsomkostninger trækkes fra. Kræver kategorier tagget med "cogs" (cost of goods sold). Formel: Bruttofortjeneste = Omsætning − Vareforbrug',
        calculationExample: [
            'Omsætning: 150.000 kr',
            'Vareforbrug (COGS): −40.000 kr',
            'Bruttofortjeneste = 150.000 − 40.000 = 110.000 kr',
        ],
    },
    bruttofortjeneste: {
        definition: 'Omsætning minus direkte vareomkostninger (vareforbrug/COGS). Viser fortjenesten på selve produktet eller ydelsen, inden driftsomkostninger trækkes fra. Kræver kategorier tagget med "cogs" (cost of goods sold). Formel: Bruttofortjeneste = Omsætning − Vareforbrug',
        calculationExample: [
            'Omsætning: 150.000 kr',
            'Vareforbrug (COGS): −40.000 kr',
            'Bruttofortjeneste = 150.000 − 40.000 = 110.000 kr',
        ],
    },
    grossMargin: {
        definition: 'Bruttofortjeneste udtrykt som en procentdel af omsætningen. Viser, hvor stor en andel af hver krone omsætning der er tilbage, efter vareomkostningerne er betalt. En høj bruttomargin indikerer god prissætning eller lave vareomkostninger. Formel: Bruttomargin = Bruttofortjeneste / Omsætning × 100',
        calculationExample: [
            'Bruttofortjeneste: 110.000 kr',
            'Omsætning: 150.000 kr',
            'Bruttomargin = 110.000 / 150.000 × 100 = 73,3%',
        ],
    },
    variableCosts: {
        definition: 'Omkostninger der ændrer sig direkte i takt med produktions- eller salgsvolumen — f.eks. råvarer, provision og emballage. Modsætningen er faste omkostninger som husleje og løn. Kræver kategorier markeret med cost_behavior = "variabel". Beregnes som summen af sådanne transaktioner.',
        calculationExample: [
            'Råvarer: 15.000 kr',
            'Provision til sælger (5% af salg): 7.500 kr',
            'Emballage: 2.500 kr',
            'Variable omkostninger i alt: 15.000 + 7.500 + 2.500 = 25.000 kr',
        ],
    },
    contributionMargin: {
        definition: 'Omsætning minus variable omkostninger. Dækningsbidraget viser, hvor meget der er tilbage til at dække faste omkostninger og skabe overskud. Formel: Dækningsbidrag = Omsætning − Variable omkostninger',
        calculationExample: [
            'Omsætning: 150.000 kr',
            'Variable omkostninger: −25.000 kr',
            'Dækningsbidrag = 150.000 − 25.000 = 125.000 kr',
            'Dækningsgrad = 125.000 / 150.000 × 100 = 83,3%',
        ],
    },
    liquidityRatio: {
        definition: 'Forholdet mellem omsætningsaktiver og kortfristet gæld. Viser virksomhedens evne til at betale sine kortfristede forpligtelser med de mest likvide aktiver. En likviditetsgrad over 1 betragtes generelt som sund. Formel: Likviditetsgrad = Omsætningsaktiver / Kortfristet gæld',
        calculationExample: [
            'Omsætningsaktiver (likvider + tilgodehavender + varelager): 200.000 kr',
            'Kortfristet gæld (leverandørgæld + kortfristede lån): 100.000 kr',
            'Likviditetsgrad = 200.000 / 100.000 = 2,0',
            'Fortolkning: virksomheden har dobbelt så mange omsætningsaktiver som kortfristet gæld.',
        ],
    },
    debtorDays: {
        definition: 'Det gennemsnitlige antal dage, det tager kunder at betale deres regninger. En lav værdi er bedst — jo hurtigere kunder betaler, jo bedre likviditet. Formel: Debitordage = (Tilgodehavender / Omsætning) × Antal dage i perioden',
        calculationExample: [
            'Tilgodehavender ved periodens slutning: 50.000 kr',
            'Omsætning i perioden (30 dage): 150.000 kr',
            'Debitordage = (50.000 / 150.000) × 30 = 10 dage',
            'Fortolkning: kunder betaler i gennemsnit efter 10 dage.',
        ],
    },
}

export const getKpiMetadata = (key: SupportedKpiKey): KpiMetadata => {
    const metadata = KPI_METADATA[key]

    return {
        definition: metadata?.definition ?? EMPTY_KPI_METADATA.definition,
        calculationExample: metadata?.calculationExample ?? EMPTY_KPI_METADATA.calculationExample,
    }
}
