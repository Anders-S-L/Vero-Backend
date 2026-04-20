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
        definition: 'Viser virksomhedens samlede indtægter i den valgte periode.',
        calculationExample: ['Virksomheden har haft 3 salg i perioden.',
        'Salg 1: 25.000 kr.',
        'Salg 2: 15.000 kr.',
        'Salg 3: 10.000 kr.',
        'Omsætning = 25.000 + 15.000 + 10.000 = 50.000 kr.'],
    },
    variableCosts: {
        definition: 'Viser de udgifter, der stiger eller falder afhængigt af virksomhedens aktivitet, fx materialer og fragt.',
        calculationExample: ['Virksomheden har haft følgende variable udgifter i perioden:',
        'Materialer: 30.000 kr.',
        'Fragt: 10.000 kr.',
        'Provision: 5.000 kr.',
        'Variable omkostninger = 30.000 + 10.000 + 5.000 = 45.000 kr.'],
    },
    contributionMargin: {
        definition: 'Viser hvor meget af omsætningen der er tilbage, når de variable omkostninger er trukket fra.',
        calculationExample: ['Omsætning: 100.000 kr.',
        'Variable omkostninger: 60.000 kr.',
        'Dækningsbidrag = 100.000 - 60.000 = 40.000 kr.'],
    },
    grossProfit: {
        definition: 'Viser hvor meget virksomheden tjener på sine varer eller ydelser, efter de direkte omkostninger er trukket fra.',
        calculationExample: ['Omsætning: 150.000 kr.',
        'Direkte omkostninger (fx vareforbrug): 90.000 kr.',
        'Bruttofortjeneste = 150.000 - 90.000 = 60.000 kr.'],
    },
    monthlyGrowthRate: {
        definition: 'Viser hvor meget fx omsætningen har ændret sig fra sidste måned til denne måned, målt i procent.',
        calculationExample: ['Omsætning sidste måned: 100.000 kr.',
        'Omsætning denne måned: 120.000 kr.',
        'Ændring = 120.000 - 100.000 = 20.000 kr.',
        'Vækstrate = (20.000 / 100.000) × 100 = 20 %'],
    },
    bruttofortjeneste: {
        definition: 'Viser hvor meget virksomheden tjener på sine varer eller ydelser, efter de direkte omkostninger er trukket fra.',
        calculationExample: ['Omsætning: 150.000 kr.',
        'Direkte omkostninger (fx vareforbrug): 90.000 kr.',
        'Bruttofortjeneste = 150.000 - 90.000 = 60.000 kr.'],
    },
    grossMargin: {
        definition: 'Viser hvor stor en del af omsætningen der er tilbage som fortjeneste, efter de direkte omkostninger er trukket fra, angivet i procent.',
        calculationExample: ['Omsætning: 150.000 kr.',
        'Direkte omkostninger: 90.000 kr.',
        'Bruttofortjeneste = 150.000 - 90.000 = 60.000 kr.',
        'Bruttomargin = (60.000 / 150.000) × 100 = 40 %'],
    },
    ebitda: {
        definition: 'Viser hvor meget virksomheden tjener på sin drift, før renter, skat og afskrivninger trækkes fra.',
        calculationExample: ['Omsætning: 200.000 kr.',
        'Driftsomkostninger: 120.000 kr.',
        'EBITDA = 200.000 - 120.000 = 80.000 kr.'],
    },
    netResult: {
        definition: 'Viser hvor mange penge virksomheden har tilbage, når alle udgifter er trukket fra de samlede indtægter.',
        calculationExample: ['Omsætning: 200.000 kr.',
        'Samlede omkostninger: 150.000 kr.',
        'Renter og skat: 20.000 kr.',
        'Nettoresultat = 200.000 - 150.000 - 20.000 = 30.000 kr.'],
    },
    cashFlow: {
        definition: 'Viser om der samlet set er kommet flere penge ind end ud af virksomheden i perioden.',
        calculationExample: ['Indbetalinger fra kunder: 120.000 kr.',
        'Udbetalinger (løn, varer, husleje): 90.000 kr.',
        'Cash flow = 120.000 - 90.000 = 30.000 kr.',
        'Der er dermed et positivt cash flow på 30.000 kr.'],
    },
    liquidityRatio: {
        definition: 'Viser hvor godt virksomheden kan betale sin kortfristede gæld med sine nuværende aktiver.',
        calculationExample: ['Omsætningsaktiver (fx kontanter og tilgodehavender): 80.000 kr.',
        'Kortfristet gæld: 50.000 kr.',
        'Likviditetsgrad = (80.000 / 50.000) × 100 = 160 %',
        'Det betyder, at virksomheden kan betale sin kortfristede gæld 1,6 gange.'],
    },
    burnRate: {
        definition: 'Viser hvor hurtigt virksomheden bruger sine penge hver måned.',
        calculationExample: ['Udgifter pr. måned: 50.000 kr.',
        'Indtægter pr. måned: 20.000 kr.',
        'Burn rate = 50.000 - 20.000 = 30.000 kr.',
        'Det betyder at virksomheden bruger 30.000 kr. mere end den tjener hver måned.'],
    },
    debtorDays: {
        definition: 'Viser hvor lang tid det i gennemsnit tager for kunderne at betale deres fakturaer.',
        calculationExample: ['Virksomheden har 60.000 kr. til gode hos kunder.',
        'Årlig omsætning: 360.000 kr.',
        'Debitor-dage = (60.000 / 360.000) × 365 = 61 dage',
        'Det betyder at kunderne i gennemsnit betaler efter 61 dage.'],
    },
}

export const getKpiMetadata = (key: SupportedKpiKey): KpiMetadata => {
    const metadata = KPI_METADATA[key]

    return {
        definition: metadata?.definition ?? EMPTY_KPI_METADATA.definition,
        calculationExample: metadata?.calculationExample ?? EMPTY_KPI_METADATA.calculationExample,
    }
}
