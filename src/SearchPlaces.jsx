import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import useDebounce from './debounce';

const API_URL = 'https://wft-geo-db.p.rapidapi.com/v1/geo/cities';
const API_KEY = import.meta.env.VITE_APP_API_KEY;

const SearchPlaces = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(5);
  const [pagination, setPagination] = useState({});
  const [numFields, setNumFields] = useState(3); // State to track the number of fields to display

  const debouncedLimit = useDebounce(limit, 300); // Custom hook to debounce the limit state

  // Function to fetch search results from the API
  const handleSearch = async (offset = 0, customLimit = limit) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }  

    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: {
          countryIds: 'IN',
          namePrefix: searchTerm,
          limit: customLimit,
          offset: offset
        },
        headers: {
          'x-rapidapi-host': 'wft-geo-db.p.rapidapi.com',
          'x-rapidapi-key': API_KEY,
        },
      });
      setSearchResults(response.data.data);
      setPagination(response.data.metadata);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handler for input change in the search input field
  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handler for Enter key press to trigger search
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Handler for changing the limit value
  const handleLimitChange = (event) => {
    const newLimit = parseInt(event.target.value);
    if (newLimit >= 1 && newLimit <= 10) {
      setLimit(newLimit);
    } else if (newLimit > 10) {
      alert('The max limit for search is 10');
      return;
    }
  };
  
  // Function to get flag URL based on country code
  const getFlagUrl = (countryCode) => {
    return `https://flagsapi.com/${countryCode}/flat/64.png`;
  };

  // Effect hook to trigger search when limit changes
  useEffect(() => {
    handleSearch();
  }, [debouncedLimit]);

  // Effect hook to add keyboard shortcut for focusing on search input
  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        document.querySelector('.search-input').focus();
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleShortcut);

    return () => {
      document.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  // Function to handle next page navigation
  const handleNextPage = () => {
    const nextPageOffset = pagination.currentOffset + limit;
    if (nextPageOffset < pagination.totalCount) {
      handleSearch(nextPageOffset);
    }
  };
  
  // Function to handle previous page navigation
  const handlePreviousPage = () => {
    const previousPageOffset = Math.max(0, pagination.currentOffset - limit);
    handleSearch(previousPageOffset);
  };

  // Handler for changing the number of fields to display
  const handleNumFieldsChange = (event) => {
    const newNumFields = parseInt(event.target.value);
    setNumFields(newNumFields);
  };

  // Calculation of total pages for pagination
  const totalPages = Math.ceil(pagination.totalCount / limit);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="search-container">
      <div className="search-inputs">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className="search-input"
          placeholder="Search..."
        />
      </div>
      <div className="dropdown-container">
        <label htmlFor="num-fields">Number of Fields: </label>
        <select id="num-fields" value={numFields} onChange={handleNumFieldsChange}>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
          <option value={6}>6</option>
        </select>
      </div>
      {loading && <div className="spinner-overlay"><div className="spinner"></div></div>}
      {!loading && searchResults.length === 0 && <div>Start searching</div>}
      {searchResults.length > 0 && (
        <div>
          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Place Name</th>
                <th>Country</th>
                {numFields >= 4 && <th>Latitude</th>}
                {numFields >= 5 && <th>Longitude</th>}
                {numFields >= 6 && <th>Population</th>}
              </tr>
            </thead>
            <tbody>
              {searchResults.map((result, index) => (
                <tr key={result.id}>
                  <td>{pagination.currentOffset + index + 1}</td>
                  <td>{result.name}</td>
                  <td>
                    <img src={getFlagUrl(result.countryCode)} alt={result.country} className="country-flag" />
                  </td>
                  {numFields >= 4 && <td>{result.latitude}</td>}
                  {numFields >= 5 && <td>{result.longitude}</td>}
                  {numFields >= 6 && <td>{result.population}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination-info">
            {pagination.totalCount > 0 && (
              <div>
                Showing {pagination.currentOffset + 1} to{' '}
                {Math.min(pagination.currentOffset + limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} results
              </div>
            )}
            <button onClick={handlePreviousPage} disabled={pagination.currentOffset === 0} className="pagination-button">
              Previous
            </button>
            {pages.map(page => (
              <button key={page} onClick={() => handleSearch((page - 1) * limit)} className="pagination-button">
                {page}
              </button>
            ))}
            <button onClick={handleNextPage} disabled={pagination.currentOffset + limit >= pagination.totalCount} className="pagination-button">
              Next
            </button>
          </div>
          <input
            type="number"
            onChange={handleLimitChange}
            className="limit-input"
          />
        </div>
      )}
    </div>
  );
};

export default SearchPlaces;
