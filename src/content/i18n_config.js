// i18n_config.js

const localeConfigs = {
    "main_config": {
        productContainer: 'div[data-component-type="s-search-result"]',
        productLink: 'div[data-cy="title-recipe"] a',
        merchantContainer: 'div.offer-display-feature-text[offer-display-feature-name="desktop-merchant-info"]',
        merchantLink: '#sellerProfileTriggerId',
        imprintContainer: 'div#page-section-detail-seller-info'
    }
}

// global filter lists

const chinaKeywords = [
    "china", "hongkong", "hong kong", "shenzhen", "guangzhou", "beijing",
    "chinese", "guangdong", "shanghai", "suzhou", "nanjing", "tianjin",
    "wuhan", "chongqing", "chengdu", "hangzhou", "xiamen", "qingdao",
    "dalian", "zhengzhou", "shenyang", "changsha", "kunming", "fuzhou",
    "nanning", "haikou", "lanzhou", "xian", "taiyuan", "shijiazhuang",
    "nanchang", "guiyang", "fujian", "jiangsu", "zhejiang", "taiwan",
    "中国", "香港", "深圳", "广州", "北京", "上海", "苏州", "南京",
    "天津", "武汉", "重庆", "成都", "杭州", "厦门", "青岛", "大连", "郑州"
];

const euKeywords = [
    "germany", "deutschland", "france", "italy", "italia", "spain", "españa",
    "europ", "europe", "austria", "österreich", "netherlands", "niederlande",
    "belgium", "belgië", "belgique", "sweden", "sverige", "denmark", "danmark",
    "finland", "suomi", "ireland", "éire", "poland", "polen", "polska",
    "czechia", "czech", "česko", "tschechien", "hungary", "magyarország",
    "portugal", "greece", "ellada", "romania", "românia", "bulgaria",
    "bǎlgariya", "croatia", "hrvatska", "slovakia", "slovensko", "slovenia",
    "slovenija", "lithuania", "lietuva", "latvia", "latvija", "estonia",
    "luxembourg", "luxemburg", "malta", "cyprus", "cypern", "kýpros"
];

const euPhoneCodes = [
    "+32", "+359", "+45", "+49", "+372", "+358", "+33", "+30", "+353",
    "+39", "+385", "+371", "+370", "+352", "+356", "+31", "+43", "+48",
    "+351", "+40", "+46", "+421", "+386", "+34", "+420", "+36", "+357"
];