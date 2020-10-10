import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker, Popup } from 'react-leaflet'
import { api, apiIbge } from '../../services/api';
import { LeafletMouseEvent } from 'leaflet'
import './style.css'
import logo from '../../assets/logo.svg'
interface Item {
  id: number;
  title: string;
  image_url: string;
}
interface Estados {
  sigla: string;
}
interface City {
  nome: string;
  id: number;
}
const CreatePoint = () => {
  const [item, setItems] = useState<Item[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [cidades, setCidades] = useState<City[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
  const [inputData, setInputData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
  const [selectedUf, setSelectedUf] = useState<string>('0');
  const [selectedCity, setSelectedCity] = useState<string>('0');

  const history = useHistory();
  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data);
    });
  }, []);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setInitialPosition([latitude, longitude]);
    })
  }, []);
  useEffect(() => {
    apiIbge.get<Estados[]>('').then(response => {
      setEstados(response.data.map(uf => uf.sigla));
    });
  }, []);
  useEffect(() => {
    if (selectedUf === '0')
      setCidades([]);
    apiIbge.get<City[]>(`${selectedUf}/municipios`).then(response => {
      setCidades(response.data);
    });

  }, [selectedUf]);
  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([event.latlng.lat, event.latlng.lng])
  }
  function handleSelectEstado(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;
    setSelectedUf(uf);
  }
  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;
    setSelectedCity(city);
  }
  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setInputData({ ...inputData, [name]: value });
  }
  function handleSelectItem(id: number) {
    const alreadySelectedItem = selectedItems.findIndex(item => item === id);
    if (alreadySelectedItem >= 0) {
      const filteredItem = selectedItems.filter(item => item !== id);
      setSelectedItems(filteredItem);
    } else {
      setSelectedItems([...selectedItems, id]);
    }

  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { name, email, whatsapp } = inputData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;
    const data = {
      name, email, whatsapp, uf, city, longitude, latitude, items
    }
    await api.post('points', data);
    alert('Ponto de Coleta Criado com Sucesso!');
    history.push('/');
  }
  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoletas" />
        <Link to='/'>
          <span><FiArrowLeft /></span>
          Voltar para Home
        </Link>
      </header>
      <form onSubmit={handleSubmit}>
        <h1>Cadastro do Ponto de Coleta</h1>
        <fieldset>
          <legend><h2>Dados</h2></legend>
          <div className="field">
            <label htmlFor="name">Nome da Entidade</label>
            <input type="text" name="name" id="name" onChange={handleInputChange} />
          </div>
          <div className="field-group">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input type="text" name="email" id="email" onChange={handleInputChange} />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange} />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend><h2>Endereço</h2>
            <span>Selecione o Endereço no Mapa</span>
          </legend>
          <Map center={initialPosition} zoom={15} onclick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>
          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado(UF)</label>
              <select name="uf" id="uf" value={selectedUf} onChange={handleSelectEstado} >
                <option value="0">Selecione uma UF</option>
                {estados.sort().map(item => (
                  < option key={item} value={item}> {item}</option>
                ))
                }
              </select>
            </div>
            <div className="field">
              <label htmlFor="uf">Cidade</label>
              <select name="city" id="city" onChange={handleSelectCity} >
                <option value="0">Selecione uma Cidade</option>
                {cidades.sort().map(item =>
                  (<option key={item.id} value={item.nome}>{item.nome}</option>)
                )}
              </select>
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend><h2>Itens de Coleta</h2>
            <span>Selecione um ou mais items abaixo</span>
          </legend>
          <ul className="items-grid">
            {item.map(item => (
              <li className={selectedItems.includes(item.id) ? "selected" : ""} key={item.id} onClick={() => handleSelectItem(item.id)} >
                <img src={item.image_url} alt={item.title} />
                <span>Bateria de carro</span>
              </li>
            ))
            }

          </ul>
        </fieldset>
        <button type="submit">Cadastrar Ponto de Coleta</button>
      </form>
    </div >
  );
}

export default CreatePoint;
