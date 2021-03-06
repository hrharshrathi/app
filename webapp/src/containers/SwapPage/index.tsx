import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { NavLink as RRNavLink } from 'react-router-dom';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import {
  MdAdd,
  MdCheckCircle,
  MdComputer,
  MdErrorOutline,
  MdLaunch,
  MdPerson,
  MdPieChart,
  MdVpnKey,
} from 'react-icons/md';
import {
  Button,
  ButtonGroup,
  Col,
  NavLink,
  Row,
  TabContent,
  TabPane,
} from 'reactstrap';

import {
  fetchPoolPairListRequest,
  fetchTokenBalanceListRequest,
  addPoolLiquidityRequest,
  fetchPoolsharesRequest,
  fetchTestPoolSwapRequestTo,
  poolSwapRequest,
  fetchUtxoDfiRequest,
  fetchMaxAccountDfiRequest,
  resetTestPoolSwapErrorTo,
  resetTestPoolSwapRequestTo,
  fetchTestPoolSwapRequestFrom,
  resetTestPoolSwapErrorFrom,
  resetTestPoolSwapRequestFrom,
} from './reducer';
import {
  calculateLPFee,
  conversionRatio,
  countDecimals,
  getNetworkType,
  getPageTitle,
  getTokenListForSwap,
} from '../../utils/utility';
import {
  SWAP,
  POOL,
  CREATE_POOL_PAIR_PATH,
  WALLET_TOKENS_PATH,
  SWAP_PATH,
  IS_DEX_INTRO_SEEN,
  LIQUIDITY_PATH,
  DEX_EXPLORER_BASE_LINK,
  MINIMUM_UTXOS_FOR_LIQUIDITY,
} from '../../constants';
import SwapTab from './components/SwapTab';
import { BigNumber } from 'bignumber.js';
import Spinner from '../../components/Svg/Spinner';
import styles from './swap.module.scss';
import PersistentStore from '../../utils/persistentStore';
import Header from '../HeaderComponent';
import openNewTab from '../../utils/openNewTab';
import { handleFetchRegularDFI } from '../WalletPage/service';
import NumberMask from '../../components/NumberMask';

interface SwapPageProps {
  history?: any;
  location?: any;
  poolshares: any[];
  fetchTestPoolSwapRequestTo: (formState) => void;
  fetchTestPoolSwapRequestFrom: (formState) => void;
  fetchPoolsharesRequest: () => void;
  poolPairList: any[];
  tokenBalanceList: string[];
  testPoolSwapTo: string;
  testPoolSwapFrom: string;
  isLoadingTestPoolSwapTo: boolean;
  isLoadingTestPoolSwapFrom: boolean;
  isErrorTestPoolSwapTo: string;
  isErrorTestPoolSwapFrom: string;
  poolSwapRequest: (formState) => void;
  isLoadingPoolSwap: boolean;
  isErrorPoolSwap: string;
  isPoolSwapLoaded: boolean;
  isLoadingRefreshUTXOS: boolean;
  isLoadingTransferringTokens: boolean;
  poolSwapHash: string;
  fetchPoolPairListRequest: () => void;
  fetchTokenBalanceListRequest: () => void;
  addPoolLiquidityRequest: (poolData) => void;
  isLoadingAddPoolLiquidity: boolean;
  isAddPoolLiquidityLoaded: boolean;
  addPoolLiquidityHash: string;
  isErrorAddingPoolLiquidity: string;
  walletBalance: number;
  utxoDfi: number;
  fetchUtxoDfiRequest: () => void;
  maxAccountDfi: number;
  fetchMaxAccountDfiRequest: () => void;
  resetTestPoolSwapErrorTo: () => void;
  resetTestPoolSwapRequestTo: () => void;
  resetTestPoolSwapErrorFrom: () => void;
  resetTestPoolSwapRequestFrom: () => void;
}

const SwapPage: React.FunctionComponent<SwapPageProps> = (
  props: SwapPageProps
) => {
  const urlParams = new URLSearchParams(props.location.search);
  const tab = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tab ? tab : SWAP);
  const [swapStep, setSwapStep] = useState<string>(
    !PersistentStore.get(IS_DEX_INTRO_SEEN) ? 'first' : 'default'
  );
  const [fromTestValue, setFromTestValue] = useState<boolean>(false);
  const [toTestValue, setToTestValue] = useState<boolean>(false);
  const [allowCalls, setAllowCalls] = useState<boolean>(false);
  const [sufficientUtxos, setSufficientUtxos] = useState<boolean>(false);
  const [formState, setFormState] = useState<any>({
    amount1: '',
    hash1: '',
    symbol1: '',
    amount2: '0',
    hash2: '',
    symbol2: '',
    balance1: '',
    balance2: '',
  });

  const {
    poolPairList,
    fetchPoolPairListRequest,
    tokenBalanceList,
    fetchTokenBalanceListRequest,
    fetchTestPoolSwapRequestTo,
    fetchTestPoolSwapRequestFrom,
    testPoolSwapTo,
    testPoolSwapFrom,
    poolSwapRequest,
    isErrorTestPoolSwapTo,
    isErrorTestPoolSwapFrom,
    isLoadingTestPoolSwapTo,
    isLoadingTestPoolSwapFrom,
    isLoadingPoolSwap,
    isErrorPoolSwap,
    poolSwapHash,
    walletBalance,
    isLoadingRefreshUTXOS,
    isLoadingTransferringTokens,
    utxoDfi,
    fetchUtxoDfiRequest,
    maxAccountDfi,
    fetchMaxAccountDfiRequest,
    resetTestPoolSwapErrorTo,
    resetTestPoolSwapRequestTo,
  } = props;

  useEffect(() => {
    fetchPoolPairListRequest();
    fetchTokenBalanceListRequest();
    fetchUtxoDfiRequest();
    fetchMaxAccountDfiRequest();
    resetTestPoolSwapErrorTo();
    resetTestPoolSwapRequestTo();
    resetTestPoolSwapErrorFrom();
    resetTestPoolSwapRequestFrom();
  }, []);

  useEffect(() => {
    async function getData() {
      const regularDFI = await handleFetchRegularDFI();
      setSufficientUtxos(regularDFI > MINIMUM_UTXOS_FOR_LIQUIDITY);
    }
    getData();
  }, []);

  useEffect(() => {
    isValidAmount() &&
      fromTestValue &&
      fetchTestPoolSwapRequestTo({
        formState,
      });
  }, [formState.amount1, formState.hash1, formState.hash2]);

  useEffect(() => {
    isValidAmount() &&
      toTestValue &&
      fetchTestPoolSwapRequestFrom({
        formState,
      });
  }, [formState.amount2, formState.hash1, formState.hash2]);

  const isValidAmount = () => {
    if (formState[`balance1`] && formState[`balance2`]) {
      return true;
    } else {
      return false;
    }
  };

  useEffect(() => {
    setFormState({
      ...formState,
      amount1: testPoolSwapFrom || '-',
    });
  }, [testPoolSwapFrom]);

  useEffect(() => {
    setFormState({
      ...formState,
      amount2: testPoolSwapTo || '-',
    });
  }, [testPoolSwapTo]);

  useEffect(() => {
    if (!testPoolSwapTo) {
      setFormState({
        ...formState,
        amount2: '0',
      });
    }
  }, [isErrorTestPoolSwapTo]);

  useEffect(() => {
    if (!testPoolSwapFrom) {
      setFormState({
        ...formState,
        amount1: '0',
      });
    }
  }, [isErrorTestPoolSwapFrom]);

  useEffect(() => {
    if (allowCalls && !isLoadingPoolSwap) {
      if (!isErrorPoolSwap && poolSwapHash) {
        setSwapStep('success');
      }
      if (isErrorPoolSwap && !poolSwapHash) {
        setSwapStep('failure');
      }
    }
  }, [poolSwapHash, isErrorPoolSwap, isLoadingPoolSwap, allowCalls]);

  const tokenMap = getTokenListForSwap(
    poolPairList,
    tokenBalanceList,
    walletBalance
  );

  const handleChangeFrom = (e) => {
    setToTestValue(false);
    setFromTestValue(true);
    if (countDecimals(e.target.value) <= 8) {
      if (formState.hash1 === '0') {
        if (
          new BigNumber(e.target.value).lte(
            Math.max(Number(formState.balance1) - 1, 0)
          ) ||
          !e.target.value
        ) {
          setFormState({
            ...formState,
            [e.target.name]: e.target.value,
            amount2: testPoolSwapTo || '-',
          });
        }
      } else {
        setFormState({
          ...formState,
          [e.target.name]: e.target.value,
          amount2: testPoolSwapTo || '-',
        });
      }
    }
  };

  const handleChangeTo = (e) => {
    setFromTestValue(false);
    setToTestValue(true);
    if (countDecimals(e.target.value) <= 8) {
      setFormState({
        ...formState,
        [e.target.name]: e.target.value,
        amount1: testPoolSwapFrom || '-',
      });
    }
  };

  const handleDropDown = (
    hash: string,
    field1: string,
    symbol: string,
    field2: string,
    balance: string,
    field3: string
  ) => {
    setFormState({
      ...formState,
      [field1]: hash,
      [field2]: symbol,
      [field3]: balance,
    });
  };

  const setMaxValue = (field: string, value: string) => {
    setFormState({
      ...formState,
      [field]: formState.hash1 === '0' ? Math.max(Number(value) - 1, 0) : value,
      amount2: testPoolSwapTo,
    });
  };

  const isValid = () => {
    if (
      formState[`amount1`] &&
      formState[`balance1`] &&
      new BigNumber(formState[`amount1`]).lte(formState[`balance1`]) &&
      // formState[`amount2`] &&
      formState[`balance2`]
      // new BigNumber(formState[`amount2`]).lte(formState[`balance2`])
    ) {
      return true;
    } else {
      return false;
    }
  };

  const isAmountInsufficient = () => {
    if (
      formState[`amount1`] &&
      formState[`balance1`] &&
      new BigNumber(formState[`amount1`]).isGreaterThan(
        formState[`balance1`]
      ) &&
      formState[`balance2`]
    ) {
      return true;
    } else {
      return false;
    }
  };

  const filterBySymbol = (symbolKey: string, isSelected: boolean) => {
    const filterMap: Map<string, any> = new Map();
    if (isSelected && formState.hash1 ^ formState.hash2) {
      const filterArray = filterByPoolPairs(symbolKey);
      const tokenArray = Array.from(tokenMap.keys());
      const finalArray = filterArray.filter((value) =>
        tokenArray.includes(value)
      );
      finalArray.map((symbol: string) => {
        if (symbol !== formState[symbolKey] && tokenMap.has(symbol)) {
          filterMap.set(symbol, tokenMap.get(symbol));
        }
      });
    } else {
      const tokenArray = Array.from(tokenMap.keys());
      tokenArray.map((symbol: string) => {
        if (symbol !== formState[symbolKey] && tokenMap.has(symbol)) {
          filterMap.set(symbol, tokenMap.get(symbol));
        }
      });
    }
    return filterMap;
  };

  const filterByPoolPairs = (symbolKey: string) => {
    const filterArray = poolPairList.reduce((tokenArray, poolPair) => {
      if (poolPair.tokenA === formState[symbolKey]) {
        tokenArray.push(poolPair.tokenB);
      } else if (poolPair.tokenB === formState[symbolKey]) {
        tokenArray.push(poolPair.tokenA);
      }
      return tokenArray;
    }, []);
    return filterArray;
  };

  const swapStepConfirm = () => {
    setSwapStep('confirm');
  };

  const swapStepDefault = () => {
    setSwapStep('default');
  };

  const handleSwap = () => {
    setAllowCalls(true);
    setSwapStep('loading');
    poolSwapRequest({
      formState,
    });
  };

  const handleInterchange = () => {
    setFormState({
      amount1: formState.amount2,
      hash1: formState.hash2,
      symbol1: formState.symbol2,
      amount2: formState.amount1,
      hash2: formState.hash1,
      symbol2: formState.symbol1,
      balance1: formState.balance2,
      balance2: formState.balance1,
    });
  };

  const handleChangeSwap = () => {
    PersistentStore.set(IS_DEX_INTRO_SEEN, true);
    setSwapStep('default');
  };

  const network = getNetworkType();

  return (
    <div className='main-wrapper'>
      <Helmet>
        <title>{getPageTitle(I18n.t('containers.swap.swapPage.title'))}</title>
      </Helmet>
      <Header>
        <h1>{I18n.t('containers.swap.swapPage.decentralizedExchange')}</h1>
        {/* <Nav pills className='justify-content-center'>
          <NavItem>
            <NavLink
              className={classnames({
                active: activeTab === SWAP,
              })}
              onClick={() => {
                setActiveTab(SWAP);
              }}
            >
              {I18n.t('containers.swap.swapPage.swap')}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({
                active: activeTab === POOL,
              })}
              onClick={() => {
                setActiveTab(POOL);
              }}
            >
              {I18n.t('containers.swap.swapPage.pool')}
            </NavLink>
          </NavItem>
        </Nav> */}
        <ButtonGroup
          style={{
            visibility: activeTab !== POOL ? 'hidden' : 'visible',
          }}
        >
          <Button to={CREATE_POOL_PAIR_PATH} tag={RRNavLink} color='link'>
            <MdAdd />
            <span className='d-lg-inline'>
              {I18n.t('containers.swap.swapPage.liquidity')}
            </span>
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button
            color='link'
            onClick={() =>
              openNewTab(`${DEX_EXPLORER_BASE_LINK}${network}net/pool`)
            }
          >
            <MdLaunch />
            <span className='d-lg-inline'>
              {I18n.t('containers.swap.swapPage.dexExplorer')}
            </span>
          </Button>
        </ButtonGroup>
      </Header>
      {PersistentStore.get(IS_DEX_INTRO_SEEN) ? (
        <div className='content'>
          <TabContent activeTab={activeTab}>
            <TabPane tabId={SWAP}>
              <SwapTab
                label={I18n.t('containers.swap.swapTab.from')}
                tokenMap={tokenMap}
                filterBySymbol={filterBySymbol}
                name={1}
                isLoadingTestPoolSwapTo={isLoadingTestPoolSwapTo}
                isLoadingTestPoolSwapFrom={isLoadingTestPoolSwapFrom}
                formState={formState}
                handleChangeFrom={handleChangeFrom}
                handleChangeTo={handleChangeTo}
                handleDropdown={handleDropDown}
                setMaxValue={setMaxValue}
                handleInterchange={handleInterchange}
                dropdownLabel={
                  formState.symbol1
                    ? formState.symbol1
                    : I18n.t('components.swapCard.selectAToken')
                }
              />
            </TabPane>
            <TabPane tabId={POOL}>
              {/* <PoolTab history={props.history} /> */}
            </TabPane>
          </TabContent>
          {isValid() &&
            activeTab === SWAP &&
            !isAmountInsufficient() &&
            !isErrorTestPoolSwapTo &&
            !isErrorTestPoolSwapFrom && (
              <Row>
                <Col md='12'>
                  <Row className='align-items-center'>
                    <Col>
                      <span>{I18n.t('containers.swap.swapPage.price')}</span>
                    </Col>
                    <Col className={`${styles.valueTxt}`}>
                      <NumberMask
                        value={Number(
                          conversionRatio(formState, poolPairList)
                        ).toFixed(8)}
                      />
                      {` ${formState.symbol2} per ${formState.symbol1}`}
                      <br />
                      <NumberMask
                        value={(
                          1 / Number(conversionRatio(formState, poolPairList))
                        ).toFixed(8)}
                      />
                      {` ${formState.symbol1} per ${formState.symbol2}`}
                    </Col>
                  </Row>
                  <hr />
                  <Row className='align-items-center'>
                    <Col>
                      <span>
                        {I18n.t('containers.swap.swapPage.minimumReceived')}
                      </span>
                    </Col>
                    <Col className={`${styles.valueTxt}`}>
                      <NumberMask value={formState.amount2} />
                      {` ${formState.symbol2}`}
                    </Col>
                  </Row>
                  <hr />
                  <Row className='align-items-center'>
                    <Col>
                      <span>
                        {I18n.t(
                          'containers.swap.swapPage.liquidityProviderFee'
                        )}
                      </span>
                    </Col>
                    <Col className={`${styles.valueTxt}`}>
                      <NumberMask
                        value={calculateLPFee(formState, poolPairList)}
                      />
                      {` ${formState.symbol1}`}
                    </Col>
                  </Row>
                  <hr />
                </Col>
              </Row>
            )}
        </div>
      ) : (
        <div className='content'>
          <>
            <section>
              <p>
                {I18n.t('containers.swap.swapPage.decentralizedExchangeInfo')}
              </p>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <MdVpnKey />
                  </div>
                  <div className={styles.featureDescription}>
                    <h3>{I18n.t('containers.swap.swapPage.yourPrivateKey')}</h3>
                    <p>
                      {I18n.t('containers.swap.swapPage.yourPrivateKeyInfo')}
                    </p>
                  </div>
                </div>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <MdPerson />
                  </div>
                  <div className={styles.featureDescription}>
                    <h3>{I18n.t('containers.swap.swapPage.nonCustodial')}</h3>
                    <p>{I18n.t('containers.swap.swapPage.nonCustodialInfo')}</p>
                  </div>
                </div>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <MdComputer />
                  </div>
                  <div className={styles.featureDescription}>
                    <h3>
                      {I18n.t(
                        'containers.swap.swapPage.decentralizedInterface'
                      )}
                    </h3>
                    <p>
                      {I18n.t(
                        'containers.swap.swapPage.decentralizedInterfaceInfo'
                      )}
                    </p>
                  </div>
                </div>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <MdPieChart />
                  </div>
                  <div className={styles.featureDescription}>
                    <h3>
                      {I18n.t('containers.swap.swapPage.poweredLiquidityPools')}
                    </h3>
                    <p>
                      {I18n.t(
                        'containers.swap.swapPage.poweredLiquidityPoolsInfo'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        </div>
      )}
      {activeTab === SWAP && (
        <footer className='footer-bar'>
          <div
            className={classnames({
              'd-none': swapStep !== 'first',
            })}
          >
            <Row>
              <Col className='text-center w-100'>
                <Button
                  color='primary'
                  className={styles.width40}
                  onClick={handleChangeSwap}
                >
                  {I18n.t('containers.swap.swapPage.continue')}
                </Button>
              </Col>
            </Row>
          </div>
          <div
            className={classnames({
              'd-none': swapStep !== 'default',
            })}
          >
            <Row className='justify-content-between align-items-center'>
              {!sufficientUtxos ? (
                <Col className={`${styles['error-dialog']} col-auto`}>
                  {I18n.t('containers.swap.swapPage.insufficientUtxos')}
                </Col>
              ) : (
                <>
                  {!isAmountInsufficient() &&
                  !isErrorTestPoolSwapTo &&
                  !isErrorTestPoolSwapFrom ? (
                    <Col className='col-auto'>
                      {isValid()
                        ? I18n.t('containers.swap.swapPage.readySwap')
                        : I18n.t('containers.swap.swapPage.enterAnAmount')}
                    </Col>
                  ) : (
                    <Col className='col-auto'>
                      <span className='text-danger'>
                        {I18n.t('containers.swap.swapPage.somethingWentWrong')}
                      </span>
                    </Col>
                  )}
                </>
              )}
              <Col className='d-flex justify-content-end'>
                <Button
                  color='primary'
                  disabled={
                    !Number(formState.amount1) ||
                    !isValid() ||
                    !!isErrorTestPoolSwapTo ||
                    !!isErrorTestPoolSwapFrom ||
                    !sufficientUtxos
                  }
                  onClick={swapStepConfirm}
                >
                  {I18n.t('containers.swap.swapPage.continue')}
                </Button>
              </Col>
            </Row>
          </div>
          <div
            className={classnames({
              'd-none': swapStep !== 'confirm',
            })}
          >
            <div className='footer-sheet'>
              <dl className='row'>
                <dt className='col-sm-4 text-right'>
                  {I18n.t('containers.swap.swapPage.from')}
                </dt>
                <dd className='col-sm-8'>
                  {`${formState.amount1} ${formState.symbol1}`}
                </dd>
                <dt className='col-sm-4 text-right'>
                  {I18n.t('containers.swap.swapPage.to')}
                </dt>
                <dd className='col-sm-8'>
                  {`${formState.amount2} ${formState.symbol2}`}
                </dd>
                <dt className='col-sm-4 text-right'>
                  {I18n.t('containers.swap.swapPage.minimumReceived')}
                </dt>
                <dd className='col-sm-8'>
                  {`${formState.amount2} ${formState.symbol2}`}
                </dd>
                <dt className='col-sm-4 text-right'>
                  {I18n.t('containers.swap.swapPage.liquidityProviderFee')}
                </dt>
                <dd className='col-sm-8'>
                  {isValid() && calculateLPFee(formState, poolPairList)}
                  {` ${formState.symbol1}`}
                </dd>
              </dl>
            </div>
            <Row className='justify-content-between align-items-center'>
              <Col className='col'>
                {I18n.t('containers.swap.swapPage.verifyTransactionSwap')}
              </Col>
              <Col className='d-flex justify-content-end'>
                <Button color='link' className='mr-3' onClick={swapStepDefault}>
                  {I18n.t('containers.swap.swapPage.cancel')}
                </Button>
                <Button color='primary' onClick={() => handleSwap()}>
                  {I18n.t('containers.swap.swapPage.swap')}&nbsp;
                </Button>
              </Col>
            </Row>
          </div>
          <div
            className={classnames({
              'd-none': swapStep !== 'success',
            })}
          >
            <div className='footer-sheet'>
              <div className='text-center'>
                <MdCheckCircle className='footer-sheet-icon' />
                <h2>
                  {I18n.t('containers.swap.swapPage.transactionComplete')}
                </h2>
                <p>
                  {I18n.t('containers.swap.swapPage.transactionSuccessMsg')}
                </p>
                <div>
                  <b>{I18n.t('containers.swap.swapPage.txHash')}</b> : &nbsp;
                  <span>{poolSwapHash}</span>
                </div>
              </div>
            </div>
            <Row className='justify-content-between align-items-center'>
              <Col className='d-flex justify-content-end'>
                <Button
                  to={WALLET_TOKENS_PATH}
                  color='link'
                  tag={RRNavLink}
                  className='mr-3'
                >
                  {I18n.t('containers.swap.swapPage.goToWallet')}
                </Button>
                <Button to={SWAP_PATH} tag={RRNavLink} color='primary'>
                  {I18n.t('containers.swap.swapPage.ok')}&nbsp;
                </Button>
              </Col>
            </Row>
          </div>
          <div
            className={classnames({
              'd-none': swapStep !== 'loading',
            })}
          >
            <div className='footer-sheet'>
              <div>
                <div className='text-center position-relative'>
                  {isLoadingRefreshUTXOS ? (
                    <>
                      <div className='d-flex'>
                        <div className={styles.loaderInline}>
                          <Spinner />
                        </div>
                        <span>
                          {I18n.t('containers.swap.swapPage.preparingUTXO')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <MdCheckCircle className={styles.txProgressSuccess} />
                      <span>
                        {I18n.t('containers.swap.swapPage.UTXOPrepared')}
                      </span>
                    </>
                  )}
                </div>
                <br />
                <div className='text-center position-relative'>
                  {!isLoadingRefreshUTXOS && (
                    <>
                      {isLoadingTransferringTokens ? (
                        <div className={styles.loaderInline}>
                          <Spinner />
                        </div>
                      ) : (
                        <MdCheckCircle className={styles.txProgressSuccess} />
                      )}
                    </>
                  )}
                  {isLoadingRefreshUTXOS ? (
                    <span>
                      {I18n.t('containers.swap.swapPage.transferringTokens')}
                    </span>
                  ) : (
                    <b>
                      {I18n.t('containers.swap.swapPage.transferringTokens')}
                    </b>
                  )}
                </div>
              </div>
              {/* <div className='text-center'>
                <Spinner />
                &nbsp;
                {I18n.t('containers.swap.swapPage.swaping')}
              </div> */}
            </div>
          </div>
          <div
            className={classnames({
              'd-none': swapStep !== 'failure',
            })}
          >
            <div className='footer-sheet'>
              <div className='text-center'>
                <MdErrorOutline
                  className={classnames({
                    'footer-sheet-icon': true,
                    [styles[`error-dialog`]]: true,
                  })}
                />
                <p>{isErrorPoolSwap}</p>
              </div>
            </div>
            <div className='d-flex align-items-center justify-content-center'>
              <Button color='primary' to={LIQUIDITY_PATH} tag={RRNavLink}>
                {I18n.t('containers.swap.addLiquidity.backToPool')}
              </Button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

const mapStateToProps = (state) => {
  const {
    poolPairList,
    tokenBalanceList,
    isLoadingAddPoolLiquidity,
    isAddPoolLiquidityLoaded,
    addPoolLiquidityHash,
    isErrorAddingPoolLiquidity,
    poolshares,
    testPoolSwapTo,
    testPoolSwapFrom,
    isErrorTestPoolSwapTo,
    isErrorTestPoolSwapFrom,
    isLoadingTestPoolSwapTo,
    isLoadingTestPoolSwapFrom,
    isLoadingPoolSwap,
    isLoadingRefreshUTXOS,
    isLoadingTransferringTokens,
    isErrorPoolSwap,
    isPoolSwapLoaded,
    poolSwapHash,
    utxoDfi,
    maxAccountDfi,
  } = state.swap;
  const { walletBalance } = state.wallet;
  return {
    poolPairList,
    tokenBalanceList,
    isLoadingAddPoolLiquidity,
    isAddPoolLiquidityLoaded,
    addPoolLiquidityHash,
    isErrorAddingPoolLiquidity,
    poolshares,
    testPoolSwapTo,
    testPoolSwapFrom,
    isErrorTestPoolSwapTo,
    isErrorTestPoolSwapFrom,
    isLoadingTestPoolSwapTo,
    isLoadingTestPoolSwapFrom,
    isLoadingPoolSwap,
    isLoadingRefreshUTXOS,
    isLoadingTransferringTokens,
    isErrorPoolSwap,
    isPoolSwapLoaded,
    poolSwapHash,
    walletBalance,
    utxoDfi,
    maxAccountDfi,
  };
};

const mapDispatchToProps = {
  fetchTestPoolSwapRequestTo,
  fetchTestPoolSwapRequestFrom,
  fetchPoolPairListRequest,
  fetchTokenBalanceListRequest,
  addPoolLiquidityRequest,
  fetchPoolsharesRequest,
  poolSwapRequest,
  fetchUtxoDfiRequest,
  fetchMaxAccountDfiRequest,
  resetTestPoolSwapErrorTo,
  resetTestPoolSwapRequestTo,
  resetTestPoolSwapErrorFrom,
  resetTestPoolSwapRequestFrom,
};

export default connect(mapStateToProps, mapDispatchToProps)(SwapPage);
