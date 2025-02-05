import { useState , useRef , useEffect} from 'react'
import { Modal } from 'bootstrap'
import axios from 'axios'
import Swal from 'sweetalert2'

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PAHT;

// Modal狀態 預設值
const defaultModalState = {
  imageUrl: "",
  title: "",
  category: "",
  unit: "",
  origin_price: "",
  price: "",
  description: "",
  content: "",
  is_enabled: 0,
  imagesUrl: [""]
};

function App() {
  // 授權狀態，預設false
  const [isAuth, setIsAuth] = useState(false);

  // 登入表單狀態
  const [ account , setAccount ] = useState({
    "username": "example@test.com",
    "password": "example"
  });

  // 處理登入
  const handleInputAccount = (e) => {
    const { name , value } = e.target;
    
    setAccount({
      ...account,
      [name] : value,
    });
  };

  // 發送登入請求
  const submitLogin = async() => {
    try {
      // 發送登入請求
      const response = await axios.post(`${BASE_URL}/admin/signin`, account);

      // 解構取出 token,expired
      const { token , expired } = response.data;
      // 寫入cookie
      document.cookie = `hexToken=${token}; expired=${new Date(expired)}`;
      getProducts();
      setIsAuth(true);
    }
    catch (error) {
      console.log(error)
    }
  };

  // 檢查授權功能
  const checkIsLogined = async() => {
    try {
      await axios.post(`${BASE_URL}/api/user/check`)
      getProducts();
      setIsAuth(true)
    }
    catch (error) {
      console.error(error.response.data)
    }
  }

  // 初始化網頁，驗證是否授權
  useEffect(() => {
    // 從cookie取token
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/,"$1",);
    // 將token放入axios.headers
    axios.defaults.headers.common['Authorization'] = token;
    checkIsLogined();
  },[])

  // 產品資料狀態
  const [products , setProducts] = useState([]);
  // 產品詳細狀態
  const [tempProduct , setTempProduct] = useState(defaultModalState);
  // 取得產品資料
  const getProducts = () => {
    axios.get(`${BASE_URL}/api/${API_PATH}/admin/products`)
      .then((res) => {
        setProducts(res.data.products)
      })
      .catch((err) => console.error(err))
  }

  // Modal相關
  const productModalRef = useRef(null);
  const [ modalMode , setModalMode ] = useState(null);

  useEffect(() => {
    // 建立Modal實例
    new Modal(productModalRef.current , {
      backdrop : false
      // 取消Modal背景&預設點擊外面關閉的功能
    });
    // 取得Modal實例
    // Modal.getInstance(productModalRef.current);
  },[])

  // Modal開關功能
  const handleOpenProductModal = ( mode , product ) => {
    // 寫入狀態
    setModalMode(mode);

    // 判斷編輯或新增
    switch (mode) {
      case "create":
        setTempProduct(defaultModalState)
        break;
      case "edit":
        setTempProduct(product);
        break;

      default:
        break;
    }

    Modal.getInstance(productModalRef.current).show()
  };

  const handleCloseProductModal = () => {
    Modal.getInstance(productModalRef.current).hide()
  };

  
  // 監聽Modal input
  const handleModalInputChange = (e) => {
    const { name , value , type , checked } = e.target;
    setTempProduct({
      ...tempProduct,
      [name] : type === "checkbox" ? checked : value
    });
  };

  // 修改副圖
  const handleImgChange = (e,index) => {
    const { value } = e.target;

    const newImgsArr = [...tempProduct.imagesUrl];

    newImgsArr[index] = value;

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImgsArr
    });
  }

  const addImg = () => {
    const newImgsArr = [...tempProduct.imagesUrl, ""];

    // newImgsArr.push("");

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImgsArr
    });
  }

  const deleteImg = () =>  {
    const newImgsArr = [...tempProduct.imagesUrl];

    newImgsArr.pop();

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImgsArr
    });
  }
  // 修改副圖

  // 建立產品
  const createProduct = async () => {
    try {
      await axios.post(`${BASE_URL}/api/${API_PATH}/admin/product`, {
        data : {
          ...tempProduct,
          origin_price : Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        }
      });
      Swal.fire({
        title: "成功建立新的產品",
        icon: "success",
        draggable: true
      }).then(() => getProducts());
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "新增產品失敗",
        text: "請重新確認資料"
      });
    }
  }

  const editProduct = async (product) => {
    const id = product.id;
    try {
      await axios.put(`${BASE_URL}/api/${API_PATH}/admin/product/${id}`, {
        data : {
          ...tempProduct,
          origin_price : Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        }
      });
      Swal.fire({
        title: "成功更新的產品",
        icon: "success",
        draggable: true
      }).then(() => getProducts());
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "更新產品失敗",
        text: "請重新確認資料"
      });
      console.log(error)
    }
  }

  const handleUpdateProduct = async (product) => {
    switch (modalMode) {
      case "create":
        await createProduct();
        break;
      case "edit":
        await editProduct(product);
        break;

      default:
        break;
    }
    handleCloseProductModal();
  }

  // 刪除產品
  const deleteProduct = async (product) => {
    try {
      const id = product.id;
      await axios.delete(`${BASE_URL}/api/${API_PATH}/admin/product/${id}`)
      Swal.fire({
        title: "成功刪除！",
        text: "產品已經刪除",
        icon: "success"
      }).then(() => getProducts());
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "產品刪除失敗",
        text: "請稍後再試"
      });
      console.log(error)
    }
  }
  
  const handleDeleteProduct = (product) => {
    Swal.fire({
      title: "確認要刪除？",
      text: "刪除後將無法復原",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "確認",
      cancelButtonText: "取消"
    }).then((result) => {
      deleteProduct(product);
    });
  }

  return (
  <>{isAuth ? (
    <div className="container mt-5 mb-3">
      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-between">
            <h2 className="fw-bolder">產品列表</h2>
            <button type="button" className="btn btn-primary fw-bolder" onClick={()=>handleOpenProductModal('create')}>建立新的產品</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">產品名稱</th>
                <th scope="col">原價</th>
                <th scope="col">售價</th>
                <th scope="col">是否啟用</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="align-middle">
                  <th scope="row">{product.title}</th>
                  <td>{product.origin_price}</td>
                  <td>{product.price}</td>
                  <td className="fw-bolder">{product.is_enabled ? (<span className="text-success">啟用</span>) : (<span>未啟用</span>)}</td>
                  <td className="text-end">
                    <div className="btn-group">
                      <button type="button" className="btn btn-outline-primary" onClick={()=>handleOpenProductModal('edit' , product)}>編輯</button>
                      <button type="button" className="btn btn-outline-danger" onClick={()=>handleDeleteProduct(product)}>刪除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : (
    <div className="container">
      <div className="row vh-100 align-items-center justify-content-center">
        <div className="col-3 text-center">
          <h1 className="fw-bold mb-4">登入系統</h1>
          <div className="form-floating mb-3">
            <input name="username" type="email" className="form-control" id="username" placeholder="Email address" onChange={handleInputAccount} />
            <label htmlFor="username">請輸入Email</label>
          </div>
          <div className="form-floating mb-3">
            <input name="password" type="password" className="form-control" id="password" placeholder="Password" onChange={handleInputAccount} />
            <label htmlFor="password">請輸入密碼</label>
          </div>
          <button type="button" onClick={submitLogin} className="btn btn-primary w-100">登入</button>
        </div>
      </div>
    </div>)}

                                                                        {/* Modal backdrop被取消，因此補上背景顏色 */}
    <div id="productModal" className="modal" ref={productModalRef} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content border-0 shadow">
          <div className="modal-header">
            <h5 className="modal-title fw-bolder">{modalMode === "create" ? "新增產品" : "編輯產品"}</h5>
            <button type="button" className="btn-close" onClick={handleCloseProductModal} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-4">
                {/* 主圖 */}
                <div className="mb-4">
                  <label htmlFor="primary-image" className="form-label">主圖</label>
                  <input name="imageUrl" id="primary-image" type="text" className="form-control mb-2" placeholder="請輸入圖片連結"
                    value={tempProduct.imageUrl} onChange={handleModalInputChange} />
                  <img src={tempProduct.imageUrl} alt={tempProduct.title} className="img-fluid" />
                </div>
                {/* 副圖 */}
                <div className="border border-2 border-dashed rounded-3 p-3">
                  {tempProduct.imagesUrl?.map((image, index) => (
                    <div key={index} className="mb-2">
                      <label htmlFor={`imagesUrl-${index + 1}`} className="form-label" > 副圖 {index + 1} </label>
                      <input value={image} onChange={(e)=>handleImgChange(e,index)} id={`imagesUrl-${index + 1}`} type="text" placeholder={`圖片網址 ${index + 1}`} className="form-control mb-2" />
                      {image && (<img src={image} alt={`副圖 ${index + 1}`} className="img-fluid mb-2" />)}
                    </div>
                  ))}
                  <div className="btn-group w-100">
                    {tempProduct.imagesUrl.length < 5 && tempProduct.imagesUrl[tempProduct.imagesUrl.length - 1] !== "" && (
                      <button className="btn btn-outline-primary btn-sm w-100" onClick={addImg}>新增圖片</button>
                    )}
                    {tempProduct.imagesUrl.length > 1 && (
                      <button className="btn btn-outline-danger btn-sm w-100" onClick={deleteImg}>取消圖片</button>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-8">

                <div className="mb-3">
                  <label htmlFor="title" className="form-label">標題</label>
                  <input name="title" id="title" type="text" className="form-control" placeholder="請輸入標題" 
                    value={tempProduct.title} onChange={handleModalInputChange} />
                </div>

                <div className="mb-3">
                  <label htmlFor="category" className="form-label">分類</label>
                  <input name="category" id="category" type="text" className="form-control" placeholder="請輸入分類"
                    value={tempProduct.category} onChange={handleModalInputChange} />
                </div>

                <div className="mb-3">
                  <label htmlFor="unit" className="form-label">單位</label>
                  <input name="unit" id="unit" type="text" className="form-control" placeholder="請輸入單位"
                    value={tempProduct.unit} onChange={handleModalInputChange} />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label htmlFor="origin_price" className="form-label">原價</label>
                    <input name="origin_price" id="origin_price" type="number" className="form-control" placeholder="請輸入原價"
                      value={tempProduct.origin_price} onChange={handleModalInputChange} />
                  </div>
                  <div className="col-6">
                    <label htmlFor="price" className="form-label">售價</label>
                    <input name="price" id="price" type="number" className="form-control" placeholder="請輸入售價"
                      value={tempProduct.price} onChange={handleModalInputChange} />
                  </div>
                </div>
              
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">產品描述</label>
                  <textarea name="description" id="description" className="form-control" rows={4} placeholder="請輸入產品描述"
                    value={tempProduct.description}  onChange={handleModalInputChange} />
                </div>

                <div className="mb-3">
                  <label htmlFor="content" className="form-label">說明內容</label>
                  <textarea name="content" id="content" className="form-control" rows={4} placeholder="請輸入說明內容"
                    value={tempProduct.content}  onChange={handleModalInputChange} />
                </div>

                <div className="form-check">
                  <input name="is_enabled" type="checkbox" className="form-check-input" id="isEnabled"
                    checked={tempProduct.is_enabled} onChange={handleModalInputChange} />
                  <label className="form-check-label" htmlFor="isEnabled">是否啟用</label>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={() => handleUpdateProduct(tempProduct)}>儲存</button>
            <button type="button" className="btn btn-secondary" onClick={handleCloseProductModal}>取消</button>
          </div>
        </div>
      </div>
    </div>
  </>)
}

export default App
